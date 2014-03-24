define({
    domainsToSkipProxisOn: [
        'nmax.com'
    ],
    proxies: [
        {
            path: 'proxy.ooo', domain: 'cdn-api.ooyala.com'
        },
        {
            path: 'proxy.api', domain: 'www.nmax.tv'
        },
        {
            path: 'proxy.cdn', domain: 'cdn.nmax.tv'
        }
    ]
})