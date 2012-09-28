$(document).ready(function(){
    var currentReservation;

  //Code to make things draggable
    $( ".new-reservation").draggable({
        revert: true,
        start: function(event,ui){
            currentReservation = $(this);
            currentReservation.addClass('dragged');
            highlightSuitableDropSpots();
        },
        stop: function(event, ui) {
            currentReservation.removeClass('dragged');
            removeHighlightsFromVacantSpots();
        }
    });

  //Code to make locations behave as drop spots
    $('.vacant-slot').droppable({
        tolerance:"touch",
        disabled: true,
        drop: function( event, ui ) {
            var reservationTime = currentReservation.height();
            $(this).height($(this).height()-reservationTime);
            currentReservation.removeClass('new-reservation dragged')
                .addClass('reservation-added')
                .draggable('destroy')
                .insertBefore($(this))
                .css({left:0,top:0});
            removeHighlightsFromVacantSpots();
        }
    });

    function highlightSuitableDropSpots(){
        var requiredSeats = currentReservation.width(),
            requiredTime = currentReservation.height();
        $('.vacant-slot').each(function(){
            var $this = $(this);
            if($this.height() >= requiredTime &&  $this.width()>=requiredSeats){
                $this.addClass('highlight-vacancy')
                    .droppable('option','disabled',false);
            }
        })
    };

    function removeHighlightsFromVacantSpots(){
        $('.highlight-vacancy').removeClass('highlight-vacancy')
            .droppable('option','disabled',true);
    }
});