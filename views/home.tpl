<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Visualize the timeline of the stars given to any GitHub repository.">
    <title>💫 Starline</title>
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <style>
      a.list-group-item, a.list-group-item:hover {
        font-weight: bold;
        color: #337ab7;
      }
    </style>
    <script src="/js/socket.io-1.2.0.js" defer></script>
    <script src="/js/app.js" defer></script>
  </head>
  <body>
    <div class="container">
      <div class="jumbotron">
        <h1>💫 Starline</h1>
        <p>Visualize the timeline of the stars given to any GitHub repository.</p>
        <form id="form" action="/">
          <div class="input-group">
            <input type="text" id="input" class="form-control" placeholder="user/repo">
            <span class="input-group-btn">
              <button class="btn btn-default btn-primary" type="submit">Collect stars!</button>
            </span>
          </div>
        </form>
        <div id="error" style="margin-top:20px" class="alert alert-danger hidden" role="alert">
          Please enter a valid repository URI, e.g. : <strong>mawrkus/starline</strong>
        </div>
      </div>
      <div id="list" class="list-group">
        {{ #repos }}
        <!-- todo partial success/error class -->
        <a
          href="/repos/{{ uri }}"
          data-href="/repos/{{ uri }}"
          id="{{ id }}"
          class="link list-group-item"
          title="View starline">
            <span class="uri">{{ uri }}</span>
            <span class="badge">{{ stars.count }} ⭐</span>
        </a>
        {{ /repos }}
      </div>
    </div>
  </body>
</html>
