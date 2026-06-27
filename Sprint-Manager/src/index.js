import Resolver from '@forge/resolver';

export { handleInstall } from './events/install.handler';
export { handleUpgrade } from './events/upgrade.handler';
export { handlePreUninstall } from './events/preUninstall.handler';

const resolver = new Resolver();

resolver.define('getText', (req) => {
    console.log(req);

    return 'Hello, world! Abhisek';
});

export const handler = resolver.getDefinitions();

