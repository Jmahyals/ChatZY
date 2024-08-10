const net = require('net');
const readline = require('readline');
const chalk = require('chalk');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Si el usuario es el servidor o cliente
const isServer = process.argv[2] === 'server';
let username;

// Pedir nombre de usuario al iniciar
const askUsername = () => {
    rl.question('Ingrese su nombre de usuario: ', (name) => {
        username = name;
        startApp();
    });
};

const startApp = () => {
    if (isServer) {
        // Crear un servidor
        const server = net.createServer();
        const clients = new Set();

        server.on('connection', (socket) => {
            console.log(chalk.green('Cliente conectado'));
            clients.add(socket);

            socket.on('data', (data) => {
                const message = data.toString().trim();
                if (message.startsWith('/')) {
                    handleCommand(message, socket);
                } else {
                    // Mostrar solo nombre y mensaje
                    console.log(chalk.blue(`${message}`));
                }
            });

            socket.on('end', () => {
                console.log(chalk.red('Cliente desconectado'));
                clients.delete(socket);
            });

            rl.on('line', (input) => {
                if (input === '/exit') {
                    server.close();
                    process.exit();
                } else if (input === '/li') {
                    console.log('Usuarios conectados:');
                    clients.forEach((client) => {
                        client.write('/li\n');
                    });
                } else {
                    clients.forEach((client) => {
                        client.write(`${username}: ${input}`);
                    });
                }
            });
        });

        server.listen(5000, () => {
            console.log(chalk.green('Esperando conexiones en el puerto 5000...'));
        });
    } else {
        // Conectarse a un servidor
        const client = net.createConnection({ port: 5000, host: 'localhost' }, () => {
            console.log(chalk.green('Conectado al servidor'));

            rl.on('line', (input) => {
                if (input === '/exit') {
                    client.end();
                    process.exit();
                } else {
                    client.write(`${username}: ${input}`);
                }
            });
        });

        client.on('data', (data) => {
            const message = data.toString().trim();
            if (message.startsWith('/')) {
                handleCommand(message);
            } else {
                // Mostrar solo nombre y mensaje
                console.log(chalk.blue(`${message}`));
            }
        });

        client.on('end', () => {
            console.log(chalk.red('Desconectado del servidor'));
        });
    }
};

// Manejar comandos
const handleCommand = (command, socket) => {
    if (command === '/li') {
        socket.write('Lista de usuarios:\n');
    } else {
        console.log(chalk.red('Comando desconocido'));
    }
};

askUsername();
