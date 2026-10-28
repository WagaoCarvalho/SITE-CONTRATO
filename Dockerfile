# =========================================================================
# Build multi-stage: compila o servidor Go e empacota junto com o front-end
# estático (HTML + CSS + JS). Sem Nginx — o próprio binário Go serve os
# arquivos e expõe /api/config para persistência de configuração.
# =========================================================================

FROM golang:1.23-alpine AS build
WORKDIR /src
COPY server/go.mod ./server/
WORKDIR /src/server
RUN go mod download 2>/dev/null || true
COPY server/ ./
RUN CGO_ENABLED=0 go build -o /server .

FROM alpine:latest
# ca-certificates: necessário para o Go validar TLS ao chamar APIs externas
# (BrasilAPI, ReceitaWS, etc.) de dentro do container — sem isso, toda
# chamada HTTPS de saída falha e o proxy de busca sempre retorna 502.
RUN apk add --no-cache wget ca-certificates

WORKDIR /usr/share/app
COPY index.html ./
COPY css/ ./css/
COPY core/ ./core/
COPY infra/ ./infra/
COPY ui/ ./ui/
COPY images/ ./images/

COPY --from=build /server /server

VOLUME ["/data"]
EXPOSE 80
CMD ["/server"]
