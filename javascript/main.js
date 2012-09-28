$(document).ready(function(){
    var currentReservation;
    $( ".new-reservation").draggable({
        revert: true,
        start: function(event, ui) {
            currentReservation = $(this);
            $(this).addClass('dragged');
            highlightPossibleVacancies();
        },
        stop: function(event, ui){
            $(this).removeClass('dragged');
            unHighlightPossibleVacancies();
        }
    });
    $('.empty-slot').droppable({
        tolerance:"touch",
        disabled: true,
         drop: function( event, ui ) {
//             currentReservation.draggable( "option", {"revert": false,"disabled": true});
             currentReservation.removeClass('new-reservation dragged')
                    .addClass('reservation-added')
                    .draggable( "destroy");
             currentReservation.appendTo($(this));
             currentReservation.css({left:0,top:0});
             unHighlightPossibleVacancies();
         }
     });



    function highlightPossibleVacancies(){
        var requiredSeats = currentReservation.width(),
            requiredTime = currentReservation.height();
        $('.empty-slot').each(function(){
            var $this = $(this);
            if($this.height() >= requiredTime &&  $this.width()>=requiredSeats){
                $this.addClass('matching-vacancy')
                    .droppable('option','disabled',false);
            }
        });
    };
    function unHighlightPossibleVacancies(){
       $('.matching-vacancy').removeClass('matching-vacancy')
            .droppable('option','disabled',true);
    };
});