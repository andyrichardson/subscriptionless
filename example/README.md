# About

Example usage of [subscriptionless](https://github.com/andyrichardson/subscriptionless).

## Serverless users

Install dependencies

```sh
npm ci
```

Deploy service

```sh
$(npm bin)/sls deploy
```

## Terraform users

Install dependencies

```sh
npm ci
```

Build assets

```sh
npm run build
```

Navigate to terraform directory

```sh
cd terraform
```

Init terraform

```sh
terraform init
```

Apply deployment

```
terraform apply
```
