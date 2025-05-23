export interface ConfigObject {
    default?: string | number;
    env: string;
}

function appConfig(obj: { [key: string]: ConfigObject }) {
    const configObj = obj;
    const get = (key: string) => {
        if (!configObj[key]) {
            return null;
        }

        const attr: ConfigObject = configObj[key];
        if (attr.env && process.env[attr.env]) {
            return process.env[attr.env];
        } else if (attr.default) {
            return attr.default;
        } else {
            return null;
        }
    };
    return {
        get,
    };
}

export default appConfig;