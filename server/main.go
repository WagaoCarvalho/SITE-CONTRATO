// Servidor HTTP minimalista (stdlib apenas, sem dependências externas):
// serve os arquivos estáticos do front-end, expõe GET/POST /api/config
// para persistir a configuração (chaves de API, tipos de contrato, etc.)
// em /data/config.json, e também funciona como proxy servidor-a-servidor
// para as buscas de CEP/CNPJ/CPF (GET /api/cep/{valor}, /api/cnpj/{valor},
// /api/cpf/{valor}) — assim a chamada às APIs externas (BrasilAPI, ViaCEP,
// apicpf.com, etc.) acontece daqui, não do navegador, e nunca esbarra em
// bloqueio de CORS (a mesma estratégia que o app Flutter do autor já usa
// com seu próprio backend).
package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const configPath = "/data/config.json"
const staticDir = "/usr/share/app"

func configHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		data, err := os.ReadFile(configPath)
		w.Header().Set("Content-Type", "application/json")
		if err != nil {
			w.Write([]byte("null"))
			return
		}
		w.Write(data)

	case http.MethodPost:
		if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err := os.WriteFile(configPath, body, 0644); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		w.Header().Set("Allow", "GET, POST")
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
	}
}

// ---------------------------------------------------------------------
// PROXY DE BUSCA (CEP / CNPJ / CPF) — reaproveita a mesma lista de
// provedores (nome/url/chave/ativo) que o usuário já configura na tela
// de Configurações, só que a chamada HTTP acontece aqui no servidor.
// ---------------------------------------------------------------------

type apiProvider struct {
	Nome  string `json:"nome"`
	URL   string `json:"url"`
	Chave string `json:"chave"`
	Ativo *bool  `json:"ativo"`
}

type apisConfig struct {
	Cep  []apiProvider `json:"cep"`
	Cnpj []apiProvider `json:"cnpj"`
	Cpf  []apiProvider `json:"cpf"`
}

type configApisOnly struct {
	Apis apisConfig `json:"apis"`
}

var httpCliente = &http.Client{Timeout: 10 * time.Second}

func carregarProvedores(categoria string) []apiProvider {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil
	}
	var cfg configApisOnly
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil
	}
	switch categoria {
	case "cep":
		return cfg.Apis.Cep
	case "cnpj":
		return cfg.Apis.Cnpj
	case "cpf":
		return cfg.Apis.Cpf
	default:
		return nil
	}
}

// proxyBuscaHandler cria o handler para uma categoria (cep/cnpj/cpf),
// tentando cada provedor configurado em ordem até um responder 200 OK,
// e repassando o corpo da resposta (JSON) direto para o navegador.
func proxyBuscaHandler(categoria, placeholder string) http.HandlerFunc {
	prefixo := "/api/" + categoria + "/"
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.Header().Set("Allow", "GET")
			http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
			return
		}
		valor := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, prefixo))
		if valor == "" {
			http.Error(w, "valor não informado", http.StatusBadRequest)
			return
		}

		provedores := carregarProvedores(categoria)
		for _, p := range provedores {
			if p.Ativo != nil && !*p.Ativo {
				continue
			}
			url := strings.ReplaceAll(p.URL, "{"+placeholder+"}", valor)

			req, err := http.NewRequest(http.MethodGet, url, nil)
			if err != nil {
				log.Printf("[proxy %s] %s: URL inválida (%s): %v", categoria, p.Nome, url, err)
				continue
			}
			req.Header.Set("Accept", "application/json")
			if p.Chave != "" {
				req.Header.Set("X-API-KEY", p.Chave)
			}

			resp, err := httpCliente.Do(req)
			if err != nil {
				log.Printf("[proxy %s] %s falhou (rede) em %s: %v", categoria, p.Nome, url, err)
				continue
			}
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				log.Printf("[proxy %s] %s respondeu %d em %s", categoria, p.Nome, resp.StatusCode, url)
				continue
			}

			w.Header().Set("Content-Type", "application/json")
			w.Write(body)
			return
		}

		http.Error(w, "nenhuma API configurada respondeu", http.StatusBadGateway)
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/config", configHandler)
	mux.HandleFunc("/api/cep/", proxyBuscaHandler("cep", "cep"))
	mux.HandleFunc("/api/cnpj/", proxyBuscaHandler("cnpj", "cnpj"))
	mux.HandleFunc("/api/cpf/", proxyBuscaHandler("cpf", "cpf"))
	mux.Handle("/", http.FileServer(http.Dir(staticDir)))

	log.Println("ouvindo na porta 80")
	log.Fatal(http.ListenAndServe(":80", mux))
}
