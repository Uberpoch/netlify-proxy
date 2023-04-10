import { Context } from 'netlify:edge';

const pathRegex = /^.*\/hub?/

const trailingSlashRegex = /\/$/
const proxyUrl = "https://read.uberflip.com/hub"
const hostHeader = "np-proxy-test.netlify.app"


export default async (request: Request, { geo }: Context) => {
  // console.log("This function is working");
  // *** commented out the if statement because it was conflicting with my site in hugo
  // if(Deno.env.get('GATSBY_LOCALE') === 'us') {
  // console.log('DENO: ', Deno);
  // console.log('initial request: ', request);
  // console.log('context: ', Context);
  //proxy to uberflip logic which strips off the trailing slash
  const newUrl = new URL(request.url);
  const url = `${newUrl.origin}${newUrl.pathname}`;
  const qs = newUrl.search;
  console.log("newURL: ", newUrl);
  console.log("URL: ", url);
  console.log("QS: ", qs);


  const hasTrailingSlash = url.match(/\/$/);
  // console.log('Has trailing slash: ', hasTrailingSlash);

  if (!hasTrailingSlash) {
    // console.log('Does NOT have trailing slash');
    let withSlashUrl = `${url}/${qs}`
    console.log('withSlashUrl inside if: ', withSlashUrl);

    return Response.redirect(withSlashUrl, 308)
  } else {
    // console.log('DOES have trailing slash');
    // *** ran the path regex on just the URL
    let path = url.replace(pathRegex, proxyUrl);
    console.log('Path: ', path);

    // console.log('PATH: ', path);
    // *** removed trailing slash on just the url
    path = path.replace(trailingSlashRegex, "");
    console.log('Path: ', path);

    path = `${path}${qs}`;

    // *** url and query strings are rejoined and passed through
    const proxyRequest = new Request(path, {
      ...request,
      method: request.method,
      headers: {
        ...request.headers,
        'X-Forwarded-Host': hostHeader,
        'X-Original-Host': hostHeader,
        'X-Netlify-Hostname': hostHeader,
      },
      redirect: request.redirect,
      body: request.body,
    })

    // console.log('PROXYREQUEST: ', proxyRequest)

    const response = await fetch(proxyRequest)

    console.log('RESPONSE: ', response)

    if (response.redirected == true) {
      let responseURL = response.url;
      const baseRegex = /^.*https\:\/\/read\.uberflip\.com\/hub?/;
      const baseRegexNoPath = /^.*https\:\/\/read\.uberflip\.com?/;
      
      if(responseURL.match(baseRegex) || responseURL.match(baseRegexNoPath)){
        const replaceSearch = responseURL.match(baseRegex) ? baseRegex : baseRegexNoPath;
        responseURL = responseURL.replace(replaceSearch, `https://${hostHeader}/hub`);
      }
      return new Response(null, {
        status: 301,
        headers: {
          Location: responseURL
        },
      })
      // }
    }

    return response
  }



  // }
}