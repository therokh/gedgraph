# GEDGraph

GEDGraph is a tool to view genealogical relationships between people with shared DNA.

## Description

GEDGraph builds a graph from genealogical data and highlights paths between two people with shared DNA. The intent is to:

* Highlight missing or unresearched sections of a tree
* Show clusters of people with shared DNA (whether the relation to them is known or not)

## Getting Started

This should run on any webserver, or you can use python to host a simple webserver inside the project directory.
```
python3 -m http.server
```

## Future

Features that might be added one day:

* Import a GEDCOM file and parse it
* Add GUI elements to add a new person and highlight people they share DNA with

## License

This project is licensed under the GPLv3 License - see the COPYING file for details

## Acknowledgments

Most of the code was mangled from examples here:
* [3d-force-graph](https://github.com/vasturiano/3d-force-graph)