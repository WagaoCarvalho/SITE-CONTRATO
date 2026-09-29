# =========================================================================
# Aplicação estática (HTML + CSS + JS) servida por Nginx.
# Nginx oficial já roda em foreground por padrão — não precisa de CMD.
# =========================================================================

FROM nginx:alpine

# Limpa o conteúdo padrão do Nginx (boa prática — evita herdar páginas de exemplo)
RUN rm -rf /usr/share/nginx/html/*

# Copia o site inteiro para o diretório de serving do Nginx.
# O .dockerignore já filtra o que NÃO deve entrar (ver abaixo).
COPY . /usr/share/nginx/html

# Configuração opcional: cache forte para assets estáticos, sem cache para HTML.
# Se não quiser essa otimização, pode remover o bloco abaixo.
RUN printf '%s\n' \
  'server {' \
  '    listen 80;' \
  '    server_name _;' \
  '    root /usr/share/nginx/html;' \
  '    index index.html;' \
  '' \
  '    # HTML e JSON sempre revalidados' \
  '    location ~* \.(html|json)$ {' \
  '        add_header Cache-Control "no-cache, must-revalidate";' \
  '        try_files $uri =404;' \
  '    }' \
  '' \
  '    # Assets estáticos com cache de 7 dias' \
  '    location ~* \.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$ {' \
  '        expires 7d;' \
  '        add_header Cache-Control "public, max-age=604800";' \
  '        try_files $uri =404;' \
  '    }' \
  '' \
  '    # Fallback: tudo o mais serve arquivo ou 404' \
  '    location / {' \
  '        try_files $uri $uri/ =404;' \
  '    }' \
  '}' \
  > /etc/nginx/conf.d/default.conf

# Documenta a porta exposta (informativo; quem publica é o compose)
EXPOSE 80