FROM cypress/base:14.15.4

ADD . /tmp
WORKDIR /tmp

# RUN groupadd -r jahians && useradd --no-log-init -r -m -g jahians jahians
# RUN chown -R jahians:jahians /tmp
# USER jahians:jahians
RUN adduser --disabled-password jahians
RUN chown -R jahians:jahians /tmp
USER jahians

RUN mkdir /tmp/run-artifacts
RUN mkdir /tmp/results

#CI=true reduces the verbosity of the installation logs
RUN CI=true yarn install
RUN CI=true /tmp/node_modules/.bin/cypress install

CMD ["/bin/bash", "-c", "/tmp/env.run.sh"]
