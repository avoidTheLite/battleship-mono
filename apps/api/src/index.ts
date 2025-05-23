import app from "./app";
import config from "./config";

const port = config.get('serverPort');

app.listen(port, () => {
    console.log(`Log level: ${config.get('logLevel')}`);
    console.log(`Server listening on port ${port} in environment ${config.get('env')}`);
})