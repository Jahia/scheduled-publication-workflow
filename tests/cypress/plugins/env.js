module.exports = (on, config) => {
    config.baseUrl = process.env.JAHIA_URL;
    config.env.JAHIA_URL = process.env.JAHIA_URL;
    config.env.SUPER_USER_PASSWORD = process.env.SUPER_USER_PASSWORD;
    config.env.MAILHOG_URL = process.env.MAILHOG_URL;    
    return config
}
