import random

class Card:
    cardTexture = ""
    cardValue   = ""
    cardShape   = ""

    def __init__(self, texture, value, shape) -> None:
        self.cardTexture = texture
        self.cardValue = value
        self.cardShape = shape

    # Return random generated card
    @staticmethod
    def RandomCard():
        cardShapes = ["clubs", "diamonds", "hearts", "spades"]
        cardValues = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"]

        rndShape = cardShapes[random.randint(0, len(cardShapes) - 1)]
        rndValue = cardValues[random.randint(0, len(cardValues) - 1)]
        textureFileName = str(rndValue) + "_of_" + str(rndShape) + ".png"
        value = 0
        if(rndValue == "king" or rndValue == "queen" or rndValue == "jack"):
            value = 10
        elif rndValue == "ace":
            value = 1
        else:
            value = int(rndValue)
        return Card(textureFileName, value, rndShape)
