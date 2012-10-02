$(document).ready(function(){
    var currentReservation,
        newReservationContainer = $('#newReservations'),
        reservationBlockOriginalOffset = $('.new-reservation').offset();
        startHour = 1700,
        reservationDragged = false;

  //Code to make things draggable
    $( ".new-reservation")
    .on('mousedown',function(){
        currentReservation = $(this);
        reservationDragged = false;
        if(currentReservation.hasClass('reservation-added')){
            updateVacantSlot(currentReservation.nextAll('.vacant-slot').first());
            currentReservation = currentReservation.detach();
            currentReservation.appendTo(newReservationContainer)
                .css({float:'none',left:currentReservation.data('leftDiff'),top:currentReservation.data('topDiff'),position:'relative'})
                .addClass('dragged new-reservation')
                .draggable('options',{revert:'invalid'})
                .removeClass('reservation-added');
        }
        highlightSuitableDropSpots();
    })
    .on('mouseup',function(){
        if(!reservationDragged){
            revertToOriginalPosition($(this));
            removeHighlightsFromVacantSpots();
        }
    })
    .draggable({
        revert: 'invalid',
        start: function(event,ui){
            reservationDragged = true;
            currentReservation.addClass('dragged');
            highlightSuitableDropSpots();
        },

        stop: function(event, ui) {
            currentReservation.removeClass('dragged');
            removeHighlightsFromVacantSpots();
        },
        revert: function(event, ui){
            revertToOriginalPosition($(this));
            return !event;
        }
    });

  //Code to make locations behave as drop spots
    $('.vacant-slot').droppable({
        tolerance:"intersect",
        disabled: true,
        hoverClass: 'draggable-object-over',
        drop: function( event, ui ) {
            var reservationSlot = $(this);

            if(confirm(getConfirmationString(reservationSlot))){
                var reservationTime = currentReservation.width();
                reservationSlot.width(reservationSlot.width() - reservationTime);

                var leftDiffBetweenVacantAndOriginal =
                    reservationSlot.offset().left -  reservationBlockOriginalOffset.left;

                var topDiffBetweenVacantAndOriginal =
                    reservationSlot.offset().top - reservationBlockOriginalOffset.top;

                currentReservation.data('leftDiff',leftDiffBetweenVacantAndOriginal+'px');
                currentReservation.data('topDiff',topDiffBetweenVacantAndOriginal+'px');

                currentReservation.removeClass('new-reservation dragged')
                    .addClass('reservation-added')
                    .css({float:'left',position:'static'})
                    .insertBefore($(this));
            }
        }
    });

    function getConfirmationString(timeSlot){
        var timePeriod = timeSlot.position().left,
            startTime = getTime(timePeriod+startHour);
            endTime = getTime(timePeriod+startHour+ currentReservation.width());

        var confirmationString =  "Do you want to reserve table ";
            confirmationString +=  timeSlot.parent().attr('id');
            confirmationString += " from " + startTime.hours + ":" + (startTime.minutes== 0 ? "00" : startTime.minutes);
            confirmationString += " to " + endTime.hours + ":" + (endTime.minutes== 0 ? "00" : endTime.minutes);
            confirmationString += "?";
        return confirmationString;

    };

    function getTime(duration){
        return{
            hours: parseInt(duration/100),
            minutes: ((((duration)%100)*60)/100)
        }
    }
    function highlightSuitableDropSpots(){
        var requiredSeats = currentReservation.height(),
            requiredTime = currentReservation.width();
        $('.vacant-slot').each(function(){
            var $this = $(this);
            if($this.height() >= requiredSeats &&  $this.width() >= requiredTime){
                $this.addClass('highlight-vacancy')
                    .droppable('option','disabled',false);
            }
        })
    };

    function removeHighlightsFromVacantSpots(){
        $('.highlight-vacancy').removeClass('highlight-vacancy')
            .droppable('option','disabled',true);
    }

    function updateVacantSlot(reservationSlot){
        reservationSlot.width(reservationSlot.width()+currentReservation.outerWidth());
    }

    function revertToOriginalPosition($element){
        $element.data('draggable').originalPosition = {
                        left: 0,
                        top: 0
                    };
        $element.animate({top:0,left:0});
    }
});