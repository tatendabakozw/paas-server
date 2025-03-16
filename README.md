server for paas
running inside a docker container
build using docker built using 
> docker build -t paas-server .
> docker-compose build
to run use in docker use:
> docker run -p 5500:5500 --env-file .env paas-server
 to run in compose use docker-compose up
 ro stop in docker use docker-compose down


Pulumi commands 
pulumi stack ls
pulumi destroy --stack <stack-name> --yes
pulumi stack rm <stack-name> --yes

TODO: fix my auth refresh tokens
TODO: make edit project accassible and make edit project use pulumi
TODO: make delete project accessible
TODO: put out logs from digital ocean to frontend
TODO: when user pushes to github, update project