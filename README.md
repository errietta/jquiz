# Kanji Quiz Game

This is a simple Kanji Quiz Game built with HTML, CSS, and JavaScript. The game allows users to test their knowledge of Kanji characters by answering questions within a time limit.

## Features

- Multiple quiz types 
- Timer for each question
- Score tracking
- Lives system
- Game over prompt with continue option

## Getting Started

### Prerequisites

- A web browser

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/jquiz.git
    ```
2. Navigate to the project directory:
    ```sh
    cd jquiz
    ```

### Usage

1. Run `npm start`
2. Click on one of the start buttons to begin the quiz.
3. Answer the questions by typing your answer and pressing Enter.
4. The game will track your score and lives. If you run out of lives, you will be prompted to continue or end the game.

## Project Structure

```
jquiz/
├── vocab/             # Vocabulary JSON files
├── game.html          # Main HTML file
├── game.js            # JavaScript file
├── style.css          # CSS file
└── README.md          # This file
```

## Create android release (NEW)
- Change stuff
- `make sync`

Set the following:
```
JQUIZ_RELEASE_STORE_FILE=<keystore path>
export JQUIZ_RELEASE_KEY_ALIAS=<the alias>
export JQUIZ_RELEASE_STORE_PASSWORD=<password>
export JQUIZ_RELEASE_KEY_PASSWORD=<password>
```
- `make build`
Open Android studio: `npx cap open android`

Click Project > Prepare Release
Choose Android Release Build (.aab)
Enter the keystore password
Enter the key password
The AAB file will be saved in the folder android/app/build/outputs/bundle/release


## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

See LICENSE

## Attribution

JLPT vocabulary list by http://www.tanos.co.uk/jlpt/skills/vocab/. JLPT Vocab list is shared under a CC-BY license.
