# A partir de qual imagem começamos a construir
# AS = é um apelido para a ETAPA de construção
FROM node:26-alpine AS builder 

# WORKDIR = O diretório de trabalho, ele coloca o terminal dentro daquele diretório
WORKDIR /app

# COPY = Copia arquivos e diretórios a partir de onde você executou o comando de build, para dentro do container
COPY . .
# Tudo que é possível gerar novamente via um comando E/OU tudo que você não VERSIONA

# Instala as dependências do projeto -> Gera o node_modules
RUN npm ci

RUN npm run build
# /app/dist

# Dentro do ambiente de construção, eu posso rodar qualquer comando linux

FROM node:26-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

RUN npm ci --omit=dev

# O comando que o container vai executar assim que ele for orquestrado
CMD ["node", "dist/src/main"]