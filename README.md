server for paas
running inside a docker container
build using docker built using 
> docker build -t paas-server .
> docker-compose build
to run use in docker use:
> docker run -p 5500:5500 --env-file .env paas-server
 to run in compose use docker-compose up
 ro stop in docker use docker-compose down
