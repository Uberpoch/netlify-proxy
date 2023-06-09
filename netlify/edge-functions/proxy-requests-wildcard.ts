import { Context } from 'netlify:edge';

const pathRegex = /^.*\/hub?/

const trailingSlashRegex = /\/$/
const proxyUrl = "https://read.uberflip.com/hub"
const hostHeader = "www.foodyfeasts.com"


export default async (request: Request, { geo }: Context) => {
  // console.log("This function is working");
  // *** commented out the if statement because it was conflicting with my site in hugo
  // if(Deno.env.get('GATSBY_LOCALE') === 'us') {
  // console.log('DENO: ', Deno);
  console.log('initial request: ', request);
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
    console.log('Does NOT have trailing slash');
    let withSlashUrl = `${url}/${qs}`
    console.log('withSlashUrl inside if: ', withSlashUrl);
    console.log('');

    return Response.redirect(withSlashUrl, 308)
  } else {
    console.log('DOES have trailing slash');
    // *** ran the path regex on just the URL
    let path = url.replace(pathRegex, proxyUrl);
    //console.log('Path: ', path);

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
      redirect: "manual",
      body: request.body,
    })

    console.log('PROXYREQUEST: ', proxyRequest)

    const response = await fetch(proxyRequest)

    console.log('');
    console.log('RESPONSE: ', response)

    
    // console.log('NEW RESPONSE: ', response);
    return response
  }



  // }
}