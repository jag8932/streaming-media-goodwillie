const fs = require('fs');
const path = require('path');

const createStream = (response, file, start, end) => {
  const stream = fs.createReadStream(file, { start, end });

  stream.on('open', () => {
    stream.pipe(response);
  });
  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });
  return stream;
};
// Pushing all the streaming code into one function means we don't have to
// rewrite it for each piece of media we want to add.
// It takes the file and the content type as well as the request/response
const streamMedia = (request, response, file, contentType) => {
  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    let { range } = request.headers;
    if (!range) {
      range = 'bytes=0-';
    }

    const positions = range.replace(/bytes=/, '').split('-');

    let start = parseInt(positions[0], 10);
    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    const chunksize = (end - start) + 1;
    response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': `${contentType}`,
    });

    return createStream(response, file, start, end);
  });
};

const getBling = (request, response) => {
  const file = path.resolve(__dirname, '../client/bling.mp3');
  streamMedia(request, response, file, 'audio/mp3');
};

const getBird = (request, response) => {
  const file = path.resolve(__dirname, '../client/bird.mp4');
  streamMedia(request, response, file, 'video/mp4');
};
const getParty = (request, response) => {
  const file = path.resolve(__dirname, '../client/party.mp4');
  streamMedia(request, response, file, 'video/mp4');
};

module.exports = {
  getParty,
  getBird,
  getBling,
};
