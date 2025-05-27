import app from "./app.ts";
import config from "./config.ts";

const port = config.get('serverPort');

app.listen(port, () => {
    console.log(`Log level: ${config.get('logLevel')}`);
    console.log(`Server listening on port ${port} in environment ${config.get('env')}`);
})