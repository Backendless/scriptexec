FROM        ubuntu:13.04
MAINTAINER  scadgek@live.com

RUN         apt-get update && \
            apt-get install -y \
                apache2 \
                openssh-server \
                supervisor

RUN         mkdir -p \
                /var/lock/apache2 \
                /var/log/supervisor \
                /var/run/apache2 \
                /var/run/sshd

COPY        supervisord.conf    /etc/supervisor/conf.d/supervisor.conf

EXPOSE      22 80

CMD         [ "/usr/bin/supervisord" ]