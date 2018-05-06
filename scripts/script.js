var anzTurns = 0;
var actualplayer = 'white';
var isDestroyMode = false;
var laterEnabled = false;
var firstTurn = true;

var fields = new Array();

var dropField;

$(document).ready(function() {
  resizeStuff();
  window.onresize = function() {
    resizeStuff();
  };

  $('#game>div').each(function(index, element) {
    fields[index] = {
      x: element.className.substring(1, 2),
      y: element.className.substring(4, 5),
      player: null
    };
  });

  $('#game>div').click(function() {
    var field = getFieldByDiv(this);

    var index;
    if (isDestroyMode) {
      if (field.player !== null && field.player != actualplayer) {
        if (!GotDestroyEnabled(field, true)) {
          isDestroyMode = false;
          index = getIndexByField(field);
          fields[index].player = null;
          updateDivNull(this);
          switchActualPlayer();
          if (anzTurns == 18) {
            $('#info').text('Nun musst du Steine ziehen');
            laterEnabled = true;

            setupLater();
          }
          teardownDelete();
        } else {
          $('#info').text('Du darfst keinen Stein der Mühle nehmen');
        }
      } else {
        $('#info').text('Zerstöre ein Stein des Gegners');
      }
    } else {
      if (field.player === null || laterEnabled) {
        anzTurns++;
        updateDivActualPlayer(this);
        field = getFieldByDiv(this);
        index = getIndexByField(field);
        fields[index].player = actualplayer;
        var destroyableFields = getDestroyableFields();
        if (GotDestroyEnabled(field, false) && destroyableFields.length > 0) {
          isDestroyMode = true;
          $('#info').text('Zerstöre einen Stein des Gegners');
          setupDelete(destroyableFields);
        } else {
          switchActualPlayer();
          if (anzTurns == 18) {
            $('#info').text('Nun musst du Steine ziehen');
            laterEnabled = true;

            setupLater();
          }
        }
      } else {
        $('#info').text('Falscher Zug');
      }
    }
  });
});

function setupLater() {
  teardownLater();

  var draggableFields = getDraggableFields();
  if (!(draggableFields.length > 0)) {
    switchActualPlayer();
  }

  setupDraggableFields();
}

function teardownLater() {
  //remove all handlers
  $('#game>div').off();
  //remove classes and draggable
  $.each(fields, function(index, value) {
    var actualfield = value;
    var i = getIndexByField(actualfield);

    //foreach field remove class + draggable
    $('#i' + (i + 1)).removeClass('draggable');
    $('#i' + (i + 1)).attr('draggable', 'false');
  });
}

function setupDraggableFields() {
  var draggableFields = getDraggableFields();
  $.each(draggableFields, function(index, value) {
    var actualfield = value;
    var i = getIndexByField(actualfield);

    //foreach draggable field add class + draggable
    $('#i' + (i + 1)).addClass('draggable');
    $('#i' + (i + 1)).attr('draggable', 'true');
  });

  $('#game>div.draggable').on('dragstart', function(event) {
    $(this).addClass('nowdragging');
    var position = parseFloat($(this).css('height')) / 2;
    event.originalEvent.dataTransfer.setData('text/plain', 'Drag Me Button');
    event.originalEvent.dataTransfer.setDragImage(this, position, position);
    dropField = null;
    var field = getFieldByDiv(this);

    var dropableFields;
    if (countFieldsOfPlayer() <= 3) {
      dropableFields = getDropableFieldsEnd();
    } else {
      dropableFields = getDropableFields(field);
    }

    $.each(dropableFields, function(index, value) {
      setupDropableField(value);
    });
  });

  $('#game>div.draggable').on('dragend', function(event) {
    //event.originalEvent.dataTransfer.setData('...', '...');
    $(this).removeClass('nowdragging');
    var field = getFieldByDiv(this);
    var dropableFields;
    if (countFieldsOfPlayer() <= 3) {
      dropableFields = getDropableFieldsEnd();
    } else {
      dropableFields = getDropableFields(field);
    }

    $.each(dropableFields, function(index, value) {
      teardownDropableField(value);
    });

    if (dropField != null) {
      var oldfieldIndex = getIndexByField(getFieldByDiv(this));
      var newfieldIndex = getIndexByField(dropField);
      var oldfieldDiv = this;
      var newfieldDiv = $('#i' + (newfieldIndex + 1));

      updateDivNull(oldfieldDiv);
      updateDivActualPlayer(newfieldDiv);

      fields[oldfieldIndex].player = null;
      fields[newfieldIndex].player = actualplayer;

      var destroyableFields = getDestroyableFields();
      if (
        GotDestroyEnabled(fields[newfieldIndex], false) &&
        destroyableFields.length > 0
      ) {
        teardownLater();
        setupDelete(destroyableFields);
        $('#info').text('Zerst�re einen Stein des Gegners');
        $('#game>div.delete').click(function() {
          fields[getIndexByField(getFieldByDiv(this))].player = null;
          updateDivNull(this);
          teardownDelete();
          //remove all handlers
          $('#game>div').off();
          switchActualPlayer();
          if (countFieldsOfPlayer() == 2) {
            displayEnd();
          } else {
            setupLater();
          }
        });
      } else {
        switchActualPlayer();
        setupLater();
      }
    }
  });
}

function teardownDropableField(field) {
  var i = getIndexByField(field);

  $('#game>div.dropable').off();

  $('#i' + (i + 1)).removeClass('dropable');
  $('#i' + (i + 1)).removeClass('activeDrag');
}
function setupDropableField(field) {
  var i = getIndexByField(field);

  //foreach draggable field add class + draggable
  $('#i' + (i + 1)).addClass('dropable');

  $('#game>div.dropable').on('dragenter', function(event) {
    $(this).addClass('activeDrag');
    dropField = getFieldByDiv(this);
  });
  $('#game>div.dropable').on('dragleave', function(event) {
    $(this).removeClass('activeDrag');
    dropField = null;
  });
  $('#game>div.dropable').on('dragover', function(event) {
    if (event.preventDefault) {
      event.preventDefault(); // Necessary. Allows us to drop.
    }
    return false;
  });
  $('#game>div.dropable').on('drop', function(event) {
    if (event.preventDefault) {
      event.preventDefault(); // Necessary. Allows us to drop.
    }
    return false;
  });
}

function teardownDelete() {
  $('#game div').removeClass('delete');
}
function setupDelete(destroyableFields) {
  var i;
  var field;

  for (i = 0; i < destroyableFields.length; i++) {
    field = destroyableFields[i];
    $('.x' + field.x + '.y' + field.y).addClass('delete');
  }
}
function getDestroyableFields() {
  var destroyableFields = new Array();
  var fieldsFromPlayer = new Array();
  var playerToCheck = getOtherPlayer();
  var actualfield;
  var i;

  for (i = 0; i < fields.length; i++) {
    actualfield = fields[i];
    if (playerToCheck == actualfield.player) {
      fieldsFromPlayer[fieldsFromPlayer.length] = actualfield;
    }
  }

  for (i = 0; i < fieldsFromPlayer.length; i++) {
    actualfield = fieldsFromPlayer[i];
    if (!GotDestroyEnabled(actualfield, true)) {
      destroyableFields[destroyableFields.length] = actualfield;
    }
  }
  return destroyableFields;
}

function GotDestroyEnabled(field, changeplayer) {
  var i;
  var actualfield;
  var playerToCheck;

  if (changeplayer) {
    playerToCheck = getOtherPlayer();
  } else {
    playerToCheck = actualplayer;
  }

  var right = 0;
  if (field.x != 4) {
    for (i = 0; i < fields.length; i++) {
      actualfield = fields[i];
      if (field.x == actualfield.x && playerToCheck == actualfield.player) {
        right++;
      }
    }
  } else {
    for (i = 0; i < fields.length; i++) {
      actualfield = fields[i];
      if (
        field.x == actualfield.x &&
        playerToCheck == actualfield.player &&
        ((actualfield.y < 4 && field.y < 4) ||
          (actualfield.y > 4 && field.y > 4))
      ) {
        right++;
      }
    }
  }
  if (right == 3) {
    return true;
  }

  right = 0;
  if (field.y != 4) {
    for (i = 0; i < fields.length; i++) {
      actualfield = fields[i];
      if (field.y == actualfield.y && playerToCheck == actualfield.player) {
        right++;
      }
    }
  } else {
    for (i = 0; i < fields.length; i++) {
      actualfield = fields[i];
      if (
        field.y == actualfield.y &&
        playerToCheck == actualfield.player &&
        ((actualfield.x < 4 && field.x < 4) ||
          (actualfield.x > 4 && field.x > 4))
      ) {
        right++;
      }
    }
  }
  if (right == 3) {
    return true;
  }
  return false;
}

function updateDivActualPlayer(divElement) {
  $(divElement).css('background', actualplayer);
}
function updateDivNull(divElement) {
  $(divElement).css('background', '');
}

function switchActualPlayer() {
  if (actualplayer == 'white') {
    actualplayer = 'black';
    $('#colorWhite').slideUp('fast', function() {
      $('#colorBlack').slideDown('fast');
    });
  } else {
    actualplayer = 'white';
    $('#colorBlack').slideUp('fast', function() {
      $('#colorWhite').slideDown('fast');
    });
  }
  $('#info').text('');
}

function getDraggableFields() {
  var draggableFields = new Array();
  var actualfield;

  for (var i = 0; i < fields.length; i++) {
    actualfield = fields[i];
    if (actualfield.player == actualplayer) {
      var dropableFields;
      if (countFieldsOfPlayer() <= 3) {
        dropableFields = getDropableFieldsEnd();
      } else {
        dropableFields = getDropableFields(actualfield);
      }

      if (dropableFields.length >= 1) {
        draggableFields[draggableFields.length] = actualfield;
      }
    }
  }

  return draggableFields;
}
function getDropableFields(field) {
  var dropableFields = new Array();
  var checkingfield;
  var offset;
  //up and down
  if (field.x == 4) {
    if (field.y < 4) {
      if (field.y == 2) {
        checkingfield = getFieldByCord(4, 1);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
        checkingfield = getFieldByCord(4, 3);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
      } else {
        checkingfield = getFieldByCord(4, 2);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
      }
    } else if (field.y > 4) {
      if (field.y == 6) {
        checkingfield = getFieldByCord(4, 5);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
        checkingfield = getFieldByCord(4, 7);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
      } else {
        checkingfield = getFieldByCord(4, 6);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
      }
    }
  } else {
    offset = Math.abs(4 - field.x);

    if (field.y < 4 || field.y > 4) {
      checkingfield = getFieldByCord(field.x, 4);
      if (checkingfield.player == null) {
        dropableFields[dropableFields.length] = checkingfield;
      }
    } else if (field.y == 4) {
      checkingfield = getFieldByCord(field.x, 4 - offset);
      if (checkingfield.player == null) {
        dropableFields[dropableFields.length] = checkingfield;
      }
      checkingfield = getFieldByCord(field.x, 4 + offset);
      if (checkingfield.player == null) {
        dropableFields[dropableFields.length] = checkingfield;
      }
    }
  }

  //left and right
  if (field.y == 4) {
    if (field.x < 4) {
      if (field.x == 2) {
        checkingfield = getFieldByCord(1, 4);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
        checkingfield = getFieldByCord(3, 4);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
      } else {
        checkingfield = getFieldByCord(2, 4);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
      }
    } else if (field.x > 4) {
      if (field.x == 6) {
        checkingfield = getFieldByCord(5, 4);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
        checkingfield = getFieldByCord(7, 4);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
      } else {
        checkingfield = getFieldByCord(6, 4);
        if (checkingfield.player == null) {
          dropableFields[dropableFields.length] = checkingfield;
        }
      }
    }
  } else {
    offset = Math.abs(4 - field.y);

    if (field.x < 4 || field.x > 4) {
      checkingfield = getFieldByCord(4, field.y);
      if (checkingfield.player == null) {
        dropableFields[dropableFields.length] = checkingfield;
      }
    } else if (field.x == 4) {
      checkingfield = getFieldByCord(4 - offset, field.y);
      if (checkingfield.player == null) {
        dropableFields[dropableFields.length] = checkingfield;
      }
      checkingfield = getFieldByCord(4 + offset, field.y);
      if (checkingfield.player == null) {
        dropableFields[dropableFields.length] = checkingfield;
      }
    }
  }

  return dropableFields;
}
function getDropableFieldsEnd() {
  var dropableFields = new Array();
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    if (field.player == null) {
      dropableFields[dropableFields.length] = field;
    }
  }
  return dropableFields;
}

function getFieldByCord(x, y) {
  for (var i = 0; i < fields.length; i++) {
    var actualfield = fields[i];
    if (x == actualfield.x && y == actualfield.y) {
      return actualfield;
    }
  }
}
function getIndexByField(field) {
  for (var i = 0; i < fields.length; i++) {
    var actualfield = fields[i];
    if (actualfield == field) {
      return i;
    }
  }
}

function getFieldByDiv(divElement) {
  var x = divElement.className.substring(1, 2);
  var y = divElement.className.substring(4, 5);
  return getFieldByCord(x, y);
}

function getOtherPlayer() {
  var otherPlayer;
  if (actualplayer == 'white') {
    otherPlayer = 'black';
  } else {
    otherPlayer = 'white';
  }
  return otherPlayer;
}

function resizeStuff() {
  if (window.innerHeight > window.innerWidth) {
    $('#game').css('width', '80%');
    $('#game').css('height', $('#game').css('width'));
    $('#game').css('width', '80%');
    $('#game').css('height', $('#game').css('width'));
    $('#game').css('left', '10%');
  } else {
    $('#game').css('height', '80%');
    $('#game').css('width', $('#game').css('height'));
    $('#game').css(
      'left',
      (parseInt($('body').css('width')) - parseInt($('#game').css('width'))) / 2
    );
  }
}

function countFieldsOfPlayer() {
  var counter = 0;
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    if (field.player == actualplayer) {
      counter = counter + 1;
    }
  }
  return counter;
}

function displayEnd() {
  var winningPlayerInGerman;
  if (getOtherPlayer() == 'white') {
    winningPlayerInGerman = 'Weiss';
  } else {
    winningPlayerInGerman = 'Schwarz';
  }
  $('#playerWhoWon').text(winningPlayerInGerman);
  $('#infoPanel').css('display', 'block');
  window.setTimeout(addDisplay, 0.000001);
}
function addDisplay() {
  $('#infoPanel').addClass('display');
}
