# User-IDs setzen
export UID=$(id -u)
export GID=$(id -g)

# Container neu starten
docker-compose -f docker-compose.dev.yml up --build
