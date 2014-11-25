define({
    domainsToSkipProxisOn: [
        'nmax.com'
    ],
    proxies: [
        {
            path: 'proxy.ooo', domain: 'cdn.nmax.tv'
        },
        {
            path: 'proxy.api', domain: 'www.nmax.tv'
        },
        {
            path: 'proxy.cdn', domain: 'cdn.nmax.tv'
        }
    ]
})