FROM        ubuntu:14.04
MAINTAINER  scadgek@live.com

RUN         apt-get update && \
            apt-get install -y \
                apt-transport-https \
                ca-certificates \
                curl \
                iptables \
                lxc \
                supervisor

# Install Docker from Docker Inc. repositories.
RUN         curl -sSL https://get.docker.com/ubuntu/ | sh

# Install the magic wrapper.
ADD         ./wrapdocker    /usr/local/bin/wrapdocker
RUN         chmod +x /usr/local/bin/wrapdocker

# Define additional metadata for our image.
VOLUME      /var/lib/docker

# Create log folder for supervisor and docker
RUN         mkdir -p /var/log/supervisor
RUN         mkdir -p /var/log/docker

COPY        supervisord.conf    /etc/supervisor/conf.d/supervisor.conf

EXPOSE      4444

CMD         [ "/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisor.conf" ]