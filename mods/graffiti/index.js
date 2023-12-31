module.exports = (build_number, isFirstTime) => {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="">

        <title>Saito Graffiti</title>
        
        <link rel="stylesheet" href="/saito/lib/font-awesome-6/css/fontawesome.min.css" type="text/css" media="screen" />
        <link rel="stylesheet" href="/saito/lib/font-awesome-6/css/all.css" type="text/css" media="screen" />
    
        <link rel="stylesheet" type="text/css" href="/saito/saito.css" />
        <link rel="stylesheet" type="text/css" href="/saito/game.css" />
        <link rel="stylesheet" type="text/css" href="/graffiti/shepherd.css" />

        <link rel="icon" media="all" type="image/x-icon" href="/favicon.ico?v=2"/>
      </head>

      <body>
        <script>window.isFirstTime = ${isFirstTime};</script>
        <script id="saito" type="text/javascript" src="/saito/saito.js?build=${build_number}"></script>
      </body>
    </html>
  `;
}