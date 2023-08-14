
const http = require('node:http');
const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3");

const client = new S3Client({});


const server = http.createServer();

const awsBucketName = process.env.AWS_BUCKET_NAME

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
  const input = {
    Bucket: awsBucketName,
  };

  const command = new ListObjectsCommand(input);

  try {
    const response = await client.send(command);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response.Contents));
  } catch (err) {
    const jsonErr = JSON.stringify(err, Object.getOwnPropertyNames(err))

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ msg: 'Internal server error', err: jsonErr }));
  }
});

server.listen(8000, () => {
  console.log('Server is running on port 8000');
});
