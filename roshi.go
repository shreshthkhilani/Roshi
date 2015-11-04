package main

import (
    "net/http"
    "github.com/gorilla/mux"
    "html/template"
    "path"
)

func home(w http.ResponseWriter, r *http.Request) {
    fp := path.Join("views", "index.html")
    tmpl, err := template.ParseFiles(fp)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    if err := tmpl.Execute(w, nil); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}

func main() {
    r := mux.NewRouter()
    r.HandleFunc("/", home)

    http.Handle("/", r)
    http.ListenAndServe(":8000", r)
}
