# lab3
- When the `readability` function is called, the following processes take place.
  - We make use of `md5File` to generate a unique `hash` of of the file based on it's contents. This is going to be the field in the database that we will use to identify the file. Our database contains the table `readability` with the following columns:
    1) `id`: `INTEGER`, the primary key, auto-incremented
    2) `hash`: `TEXT`
    3) `numberOfSentences`: `INTEGER`
    4) `numberOfWords`: `INTEGER`
    5) `numberOfLetters`: `INTEGER`
    6) `numberOfNumbers`: `INTEGER`
    6) `ariIndex`: `NUMERIC`, since it is going to store decimals
    6) `clScore`: `NUMERIC`, since it is going to store decimals
  - We check the database to see if we already have a data for this `hash`.
  - If we have the file, we just return the formatted log of the required output without calling `colemanLiau` and `automatedReadabilityIndex` functions.
  - If we do not have the file:
    - We make use of `tokenize` and `tokenizeEnglish` packages to get the number of sentences, words, letters and numbers. For letters and numbers, we simply use regular expressions to extract them.
    - We call `colemanLiau` to get the Coleman-Liau score.
    - We call `automatedReadabilityIndex` to get the Automated Readability Index score.
    - We save these values into the database so that we do not have to re-compute them every time `readability` is called with the same same file.
    - We return the formatted log of the required output. 
  
