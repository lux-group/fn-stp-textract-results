# Straight Through Processing (STP) Textract Results 

[![CircleCI](https://circleci.com/gh/brandsExclusive/fn-stp-textract-results.svg?style=svg)](https://circleci.com/gh/brandsExclusive/fn-stp-textract-results)

Lambda function that subscribes to SNS topic, collects textract results and stores them in a S3 bucket.

## Configuration

See config files in `./deploy` folder for lambda naming, SNS topic and S3 bucket names.

## Deployment

To deploy run the following JOBS on jenkins

TODO: configure jenkins

* [TEST](https://jenkins.luxgroup.com/job/release-test-stp-process-inbox-fn/)

* [PRODUCTION](https://jenkins.luxgroup.com/job/release-prod-stp-process-inbox-fn/)

To deploy locally install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux-mac.html)
and run the following:

TEST

```
$ yarn deploy-test
```

PRODUCTION

```
$ yarn deploy-production
```

## Logs

To tail logs locally install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux-mac.html)
and run the following:

TEST

```
$ yarn logs-test
```

PRODUCTION

```
$ yarn logs-production
```

## Maintainers

* [Justin Hopkins](https://github.com/innomatics)

## Collaborators

* TBA
