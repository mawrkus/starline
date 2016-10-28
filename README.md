# 💫 Starline [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contribute)

Visualize the timeline of the stars given to a GitHub repository. I. e. the number of stars given on any given day.

This package uses the [GitHub API](https://developer.github.com/v3/activity/starring/) to collect all the star creation timestamps. The data is visualized thanks to [D3](https://d3js.org/).

## Installation

The package needs **node >= 6** and for now, can be installed via `git clone` only:

```shell
$ git clone https://github.com/mawrkus/starline.git
$ cd starline
$ npm install
```
At this stage you will need to generate a personal access token. This can be easily done by logging in to GitHub then `Profile Settings > Personal access token`. Once generated, place it in a `.env` file:

```shell
$ echo GITHUB_ACCESS_TOKEN=[your github access token] > .env
```

Don't hesitate to check [GitHub's documentation](https://developer.github.com/v3/) for more information about the API and authentication in general.

## Usage example

```shell
$ npm run collect:stars mawrkus/js-unit-testing-guide
$ npm run server
```

Open a Web browser, go to `http://127.0.0.1:8080`, et voilà!

Is the repository sleepy, trendy, steady or just dead? I hope this tool will help.

## Contribute

1. Fork it: `git clone https://github.com/mawrkus/starline.git`
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT.

## Background

This small project started out of curiosity: why always considering the number of stars of a GitHub project without considering *when* they were given? After playing a while with GitHub's API, I decided to dig in.

Ideas for a future roadmap:

- Contrast the starline with other activities by adding more graphs: release dates, commits, PR, ...
- Unit tests. Shame... (actually, starting again with proper TDD would be nice)
- Playing more with the visualizations/trying other visualizations libraries
