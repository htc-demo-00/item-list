
const http = require('node:http');
const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3");
const { SQSClient, GetQueueAttributesCommand } = require("@aws-sdk/client-sqs");

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

const server = http.createServer();

const awsBucket = process.env.AWS_BUCKET
const sqsQueueUrl = process.env.AWS_SQS_QUEUE_URL

for (const sig of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
  process.on(sig, () => {
    server.close((err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      process.exit(0);
    });
  });
}

// Listen to the request event
server.on('request', async (request, res) => {
  const listCommand = new ListObjectsCommand({
    Bucket: awsBucket,
  });

  const queueAttributesCommand = new GetQueueAttributesCommand({
    QueueUrl: sqsQueueUrl,
    AttributeNames: ['ApproximateNumberOfMessages']
  });

  try {
    const s3Response = await s3Client.send(listCommand);
    const sqsResponse = await sqsClient.send(queueAttributesCommand);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      s3: {
        list: s3Response.Contents,
      },
      sqs: {
        queueAttributes: sqsResponse.Attributes,
      }
    }));
  } catch (err) {
    const jsonErr = JSON.stringify(err, Object.getOwnPropertyNames(err))

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ msg: 'Internal server error', err: jsonErr }, null, 2));
  }
});

server.listen(8000, () => {
  console.log('Server is running on port 8000');
});
