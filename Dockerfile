FROM ubuntu:22.04

ENV APP_NAME=corpora-api
ENV DEPLOYMENT_STAGE=test
ENV EXPORT_ENV_VARS_TO_LAMBDA="APP_NAME DEPLOYMENT_STAGE"
ENV LC_ALL=C.UTF-8
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y python3 libhdf5-dev python3-h5py gettext moreutils build-essential libxml2-dev python3-dev python3-pip zlib1g-dev python3-requests python3-aiohttp llvm jq && \
    rm -rf /var/lib/apt/lists/*

# Don't re-run pip install unless either requirements.txt has changed.
WORKDIR /single-cell-data-portal
ADD requirements.txt requirements-base.txt
ADD backend/api_server/requirements.txt requirements-api.txt
RUN python3 -m pip install -r requirements-base.txt -r requirements-api.txt
EXPOSE 5000

# Install utilities to /single-cell-data-portal so we can run db migrations.
ADD tests /single-cell-data-portal/tests
ADD scripts /single-cell-data-portal/scripts
ADD backend /single-cell-data-portal/backend

ARG HAPPY_BRANCH="unknown"
ARG HAPPY_COMMIT=""
LABEL branch=${HAPPY_BRANCH}
LABEL commit=${HAPPY_COMMIT}
ENV COMMIT_SHA=${HAPPY_COMMIT}
ENV COMMIT_BRANCH=${HAPPY_BRANCH}

ENTRYPOINT ["./container_init.sh"]
