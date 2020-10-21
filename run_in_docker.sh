#!/bin/bash -e

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Build docker
# The name of the docker, must be in lowercase
DOCKER_IMAGE=lynx_docker
docker build . -f Dockerfile -t ${DOCKER_IMAGE}
docker tag ${DOCKER_IMAGE} ${DOCKER_IMAGE}

# Run in docker
CMD="npm start"
docker run -it -p 8080:8080 -v ${PROJECT_DIR}:/usr/src/app -d ${DOCKER_IMAGE}:latest ${CMD}


#docker run -it -p 8080:8080 -v /home/actia/project/lynx:/usr/src/app lynx_docker:latest /bin/bash