FROM nginx:alpine

# Remove o conteúdo padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos do projeto para o diretório de serviço do nginx
COPY . /usr/share/nginx/html

# Expor a porta 80
EXPOSE 80