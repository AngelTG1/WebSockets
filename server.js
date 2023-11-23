const WebSocket = require('ws');
const https = require('https');
const express = require('express');
const cors = require('cors');


const app = express();
app.use(cors());


const options = {
    private_key:"",
    cert: ""
}

const server = https.createServer(options, app);

const wss = new WebSocket.Server({ server, path: '/sensores' });

let datosSensores = {
  humedad: null,
  temperatura: null,
  gasMetano: null,
  luz: null,
};

app.use(express.json());
app.post('/datos-sensores', (req, res) => {
  const { type, value } = req.body;

  datosSensores[type] = value;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(datosSensores));
    }
  });

  res.status(200).json({ message: 'Datos recibidos y almacenados correctamente.' });
});

app.get('/sensores/all', (req, res) => {
  res.status(200).json({ message: 'Datos de sensores obtenidos correctamente.', data: datosSensores });
});

wss.on('connection', (ws) => {
  console.log('¡Cliente conectado!');
  ws.send(JSON.stringify(datosSensores));

  ws.on('message', (message) => {
    console.log(`Mensaje recibido: ${message}`);

    try {
      const data = JSON.parse(message);
      const { type, value } = data;

      datosSensores[type] = value;

      switch (type) {
        case 'humedad':
          console.log(`Humedad recibida: ${value}`);
          break;
        case 'temperatura':
          console.log(`Temperatura recibida: ${value}`);
          break;
        case 'gasMetano':
          console.log(`Gas de metano recibido: ${value}`);
          break;
        case 'luz':
          console.log(`Luz recibida: ${value}`);
          break;
        default:
          console.log('Tipo de dato desconocido');
      }

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(datosSensores));
        }
      });

      ws.send('¡Mensaje recibido por el servidor!');
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
    }
  });

  ws.on('close', () => {
    console.log('¡Cliente desconectado!');
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});