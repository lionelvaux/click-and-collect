# C1ick ⅋ c⊗LLec⊥

The repository contains
frontend and backend code
for an online interactive sequent prover for linear logic.

## Technical informations and roadmap
Some informations are available in the [wiki](https://github.com/etiennecallies/click-and-collect/wiki).

## Install

### Make share proof work

```
git clone git@github.com:fccm/ocaml-lzma.git
opam pin add lzma ocaml-lzma/ -n
opam depext lzma
opam install lzma
```

### Install system dependencies

- System dependencies for ocsigen-start (excluding postgresql as we rely on sqlite3)
```
libgdbm-dev libsqlite3-dev debianutils imagemagick libgdbm-dev libgmp-dev libpcre3-dev libssl-dev npm pkg-config ruby-sass zlib1g-dev
```
- System dependencies for lzma
```
liblzma-dev
```
- System dependencies for the SQLite3 backend of `ocsipersist`
```
libsqlite3-dev pkg-config
```

To install everything under Debian-like distros:
```
sudo apt install libgdbm-dev libsqlite3-dev debianutils imagemagick libgdbm-dev libgmp-dev libpcre3-dev libssl-dev npm pkg-config ruby-sass zlib1g-dev liblzma-dev libsqlite3-dev
```

### Build using opam

- First initialize opam if necessary

```
sudo apt-get install opam
opam init
```
- Make sure you are running a recent compiler (to get the list of available
  versions, use `opam switch list-available`).
```
opam switch create 4.12.0 # latest version at the time of writing
```
- Install [lzma](https://github.com/fccm/ocaml-lzma) package from source, as it is sadly not available on opam
```
git clone git@github.com:fccm/ocaml-lzma.git
opam pin add lzma ocaml-lzma/ -n
opam install lzma
```
- Install `ocsigen-start`
```
opam install ocsigen-start
```
- Clone this repository
```
git clone https://github.com/etiennecallies/click-and-collect
```
- Build and launch
```
cd click-and-collect
make test.byte
```

Now you can visit [http://localhost:8080]() and play with click-and-collect.

### Deploy on server
Same as local dev, except that we need to proxy port 8080 by nginx (or Apache).
- Add this nginx config (install it with `sudo apt install nginx`)
```
server {
    root /home/{username}/click-and-collect;
    index index.html;
    server_name {hostname};

    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
```
- Allow https by adding a certificate `sudo certbot --nginx`

### Make LaTeX export work
If you don't have LaTeX environment installed on your machine (or your server), you can proceed as following to make LaTeX export work.
- Install TexLive (for LaTeX to PDF/PNG export) following guidelines like [these ones](https://doc.ubuntu-fr.org/utilisateurs/sssammm/installer_texlive).
- Install `poppler-utils` (for LaTeX to PNG export)
```
sudo apt-get install poppler-utils
```

## Contribute
### Modify Coq nanoyalla package
Whenever a file in `nanoyalla/` directory package is modified, nanoyalla version should be incremented that way:

1. Increment version in `nanoyalla/README.md`.
2. Increment version in `export_as_coq.ml`, in header printed in generated files.
3. Zip `nanoyalla/` directory: `rm -f static/download/nanoyalla.zip && zip -r static/download/nanoyalla.zip nanoyalla/`

### Modify parser
Do not modify `ll_parser.mli` or `ll_parser.ml` neither `ll_lexer.mll`, but just `ll_parser.mly` and `ll_lexer.mll` and then run
```
ocamllex ll_lexer.mll && ocamlyacc ll_parser.mly
```

## Test
### Test API
There are some API tests in `test/api_test.ml`, which uses test data in `api_test_data.json`. It calls API and checks its response.

First time:
```
opam install alcotest
```

First time and whenever you change test script (no need if you change only the json file):
```
ocamlfind ocamlc -thread -linkpkg -package alcotest -package lwt -package cohttp -package cohttp-lwt-unix -package threads -package yojson -package str -o test/api_test test/api_test.ml
```

To execute tests (you need to have `make test.byte` running):
```
test/api_test
```

### Test Coq
To check that Coq files returned by API actually compile, we have some examples of proof as json object in `test/proof_test_data`. Some additional Coq files can be checked to compile in `test/coq_test_data`.

To execute tests (you need to have `make test.byte` running):
```
test/coq_test.sh
```

### Test LaTeX
To check that LaTeX files returned by API actually compile, we have some examples of proof as json object in `test/proof_test_data`.

To execute tests (you need to have `make test.byte` running):
```
test/latex_test.sh
```


## Tribute
This tool design was mainly inspired by [Logitext](http://logitext.mit.edu/main) ([GitHub](https://github.com/ezyang/logitext)).
