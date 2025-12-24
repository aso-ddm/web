import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

export interface FrontendStaticSiteStackProps extends StackProps {
  environmentName: string;
  buildPath: string;
  domainName: string;
  wwwDomainName: string;
  hostedZoneId: string;
  certificate: acm.ICertificate;
}

export class FrontendStaticSiteStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStaticSiteStackProps) {
    super(scope, id, props);

    // Response headers to match Amplify customHTTP
    const responseHeaders = new cloudfront.ResponseHeadersPolicy(this, 'ResponseHeaders', {
      securityHeadersBehavior: {
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
      },
    });

    // Cache policies
    const htmlCache = new cloudfront.CachePolicy(this, 'HtmlCache', {
      defaultTtl: Duration.seconds(0),
      minTtl: Duration.seconds(0),
      maxTtl: Duration.seconds(0),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
    });

    const staticCache = new cloudfront.CachePolicy(this, 'StaticCache', {
      defaultTtl: Duration.days(30),
      minTtl: Duration.days(1),
      maxTtl: Duration.days(365),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
    });

    // Import Hosted Zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: 'dragondemadera.com',
    });

    // L3 construct: S3 private bucket + CloudFront
    const cfS3 = new CloudFrontToS3(this, 'FrontendSite', {
      insertHttpSecurityHeaders: false,
      bucketProps: {
        enforceSSL: true,
        autoDeleteObjects: false,
        removalPolicy: RemovalPolicy.RETAIN,
      },
      cloudFrontDistributionProps: {
         domainNames: [props.domainName, props.wwwDomainName],
         certificate: props.certificate,
        defaultRootObject: 'index.html',
        defaultBehavior: {
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: htmlCache,
          responseHeadersPolicy: responseHeaders,
        },
        errorResponses: [
          // SPA rewrite rules equivalent to Amplify
          { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.seconds(0) },
          { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.seconds(0) },
        ],
      },
    });

    // Add additional behaviors after construct creation
    const distribution = cfS3.cloudFrontWebDistribution;
    const s3Origin = new origins.S3Origin(cfS3.s3Bucket!);

    distribution.addBehavior('/_next/*', s3Origin, {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: staticCache,
      responseHeadersPolicy: responseHeaders,
    });

    // Deployment of frontend build with CloudFront invalidation
    new s3deploy.BucketDeployment(this, 'DeployFrontendBuild', {
      sources: [s3deploy.Source.asset(props.buildPath)],
      destinationBucket: cfS3.s3Bucket!,
      distribution: cfS3.cloudFrontWebDistribution!,
      distributionPaths: ['/*'],
      prune: true,
    });

    // Create Route53 A record pointing to CloudFront
    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: props.domainName!,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // Create Route53 A record for www subdomain
    new route53.ARecord(this, 'WwwAliasRecord', {
      zone: hostedZone,
      recordName: props.wwwDomainName!,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });
  }
}
