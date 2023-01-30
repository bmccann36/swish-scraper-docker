

## push commands


Retrieve an authentication token and authenticate your Docker client to your registry.
Use the AWS CLI:
```shell
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 657117174612.dkr.ecr.us-east-1.amazonaws.com
```

Build your Docker image using the following command. 
```shell
docker build -t 657117174612.dkr.ecr.us-east-1.amazonaws.com/swishscraper:latest .
```

Run the following command to push this image to your newly created AWS repository:

```shell
docker push 657117174612.dkr.ecr.us-east-1.amazonaws.com/swishscraper:latest
```

## making x86_64 build on mac (doesn't really work)

docker buildx build --platform linux/amd64 --load -t swish-scraper .
docker run --platform linux/amd64 swish-scraper
