// Servidor HTTP minimalista (stdlib apenas, sem dependências externas):
// serve os arquivos estáticos do front-end e expõe GET/POST /api/config
// para persistir a configuração (chaves de API, tipos de contrato, etc.)
// em /data/config.json — assim as configurações não dependem só do
// localStorage de cada navegador.
package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
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

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/config", configHandler)
	mux.Handle("/", http.FileServer(http.Dir(staticDir)))

	log.Println("ouvindo na porta 80")
	log.Fatal(http.ListenAndServe(":80", mux))
}
