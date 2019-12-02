/*
 jquery plug-in for build a table with sticky table header and columns, and DnD columns.

 Copyright 2013-2020 Vitaly Pogrebenko
 http://www.altanovasoftware.com/

 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:
 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
;(function ($, window)
{
    $(
        function()
        {
            var pvaTable   = 'pvaTable';

            var pvaOptions = {
                  sticky_col         : 'sticky_col'
                , border_right_width : 2
                , border_right_color : 'darkslategray'
                , border_right_style : 'dotted' // dashed, dotted, double
                , onRefresh          : saveTableCookie
            };

            $( document ).ready
            (
                function ()
                {
                    setTimeout(
                        function()
                        {
                            $( document ).trigger( 'afterdocumentready' );
                        }
                        , 1
                    );

                    $( document ).bind( 'afterdocumentready', afterDocumentReady );
                }
            );

            function afterDocumentReady()
            {
                var pvaTableID = function() { return '.' + pvaTable; };

                $( pvaTableID() ).each(
                    function()
                    {
                        var _this         = $( this );
                        var defaultConfig = {
                              sID        : _this.parent().attr( 'id' )
                            , nStickyCol : -1
                        };
                        var pConfig       = restoreTableCookie( defaultConfig );

                        if( pConfig.nStickyCol >= 0 )
                        {
                            init_sticky_line( _this, pConfig, pConfig.nStickyCol );
                        }

                        init_sticky_rows( 'rowTable', pConfig );
                        init_sticky_cols( 'colTable', pConfig );
                        init_sticky_corn( 'crnTable', pConfig, 'colTable' );

                        init_dnd_cols( _this );

                        $( 'body' ).dblclick(
                            function ( e )
                            {
                                var el = e.target;
                                if( el )
                                {
                                    var sName = el.nodeName.toLowerCase();
                                    if( sName != 'th' && sName != 'td' )
                                    {
                                        el = closest( el, [ 'th', 'td' ] );
                                        if( el )
                                        {
                                            sName = el.nodeName.toLowerCase();
                                        }
                                    }
                                    switch( sName )
                                    {
                                        case 'th': case 'td':
                                        {
                                            var stickyCorner = _this.parent().find( '.crnTable' );
                                            var stickyColumn = _this.parent().find( '.colTable' );
                                            var stickyRows   = _this.parent().find( '.rowTable' );

                                            if(    stickyCorner.length > 0 && stickyCorner.is( ':hidden' )
                                                && stickyColumn.length > 0 && stickyColumn.is( ':hidden' ) )
                                            {
                                                init_sticky_line( _this, pConfig, el.cellIndex );
                                                refresh( pConfig );
                                            }
                                            else
                                            {
                                                stickyCorner.hide();
                                                stickyColumn.hide();

                                                var sticky = _this.find( '.' + pvaOptions.sticky_col );
                                                if( sticky.length > 0 )
                                                {
                                                    init_sticky_line( _this, pConfig, sticky[ 0 ].cellIndex );
                                                    refresh( pConfig );
                                                }
                                            }

                                            if( stickyRows.length > 0 && !stickyRows.is( ':hidden' ) )
                                            {
                                                stickyRows.hide();
                                                stickyRows.empty();
                                                build_sticky_rows( stickyRows, _this );
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                        );
                    }
                );
            }

            function refresh( pConfig )
            {
                if( pvaOptions.onRefresh != null )
                {
                    return pvaOptions.onRefresh( pConfig );
                }
            }

            function saveTableCookie( pConfig )
            {
                var config_copy = JSON.parse( JSON.stringify( pConfig ) );
                if( config_copy )
                {
                    $.cookie( pConfig.sID, JSON.stringify( config_copy ) );
                }
            }

            function restoreTableCookie( pConfig )
            {
                var cookie = $.cookie( pConfig.sID );
                if( cookie )
                {
                    var savedConfig = JSON.parse( cookie );
                    if( savedConfig )
                    {
                        return savedConfig;
                    }
                }
                return pConfig;
            }

            function init_sticky_line( pTable, pConfig, nStickyCol )
            {
                if( pTable.hasClass( pvaTable ) )
                {
                    var th = pTable.find( "thead>tr:first>th:nth-child(" + (nStickyCol+1).toString() + ")" );
                    if( th )
                    {
                        var bStickyCol = th.hasClass( pvaOptions.sticky_col );

                        resetSticky( pConfig, bStickyCol, nStickyCol, th );
                        resetTable( bStickyCol, nStickyCol, pTable, 'thead' );
                        resetTable( bStickyCol, nStickyCol, pTable, 'tbody' );
                    }
                }
            }

            function resetSticky( pConfig, bStickyCol, nStickyCol, th )
            {
                if( bStickyCol )
                {
                    pConfig.nStickyCol = -1;
                    th.removeClass( pvaOptions.sticky_col );
                }
                else
                {
                    th.parent().children().each(
                        function()
                        {
                            $( this ).removeClass( pvaOptions.sticky_col );
                        }
                    );

                    pConfig.nStickyCol = nStickyCol;
                    th.addClass( pvaOptions.sticky_col );

                    saveStickyCell( th, th );
                }
            }

            function resetTable( bStickyCol, nStickyCol, pTable, region )
            {
                pTable.find( region + ' tr' ).each(
                    function()
                    {
                        $( this ).children().each(
                            function( nCol )
                            {
                                var cell = $( this );
                                if( nCol == nStickyCol && !bStickyCol )
                                {
                                    setStickyCell( cell );
                                }
                                else
                                {
                                    var from = pTable.find( "thead>tr:first>th:nth-child(" + (nCol+1).toString() + ")" );

                                    restoreStickyCell( cell, from );
                                }
                            }
                        );
                    }
                );
            }

            function setStickyCell( cell )
            {
                cell.css( 'border-right-width', pvaOptions.border_right_width );
                cell.css( 'border-right-color', pvaOptions.border_right_color );
                cell.css( 'border-right-style', pvaOptions.border_right_style );
            }

            function restoreStickyCell( to, from )
            {
                to.css( 'border-right-width', from.attr( 'border-right-width' ) );
                to.css( 'border-right-color', from.attr( 'border-right-color' ) );
                to.css( 'border-right-style', from.attr( 'border-right-style' ) );
            }

            function saveStickyCell( to, from )
            {
                to.attr( 'border-right-width', from.css( 'border-right-width' ) );
                to.attr( 'border-right-color', from.css( 'border-right-color' ) );
                to.attr( 'border-right-style', from.css( 'border-right-style' ) );
            }





            // ++++++ STICKY TOP-LEFT CORNER +++++++
            //

            function init_sticky_corn( sticky, pConfig, cols )
            {
                var stickyID = function () { return '.' + sticky; };
                var colsID   = function () { return '.' + cols; };
                var originID = function () { return '.' + pConfig.sID; };
                var divID    = function () { return '#' + pConfig.sID; };

                var originTable = $( originID() );
                if( originTable.length > 0 )
                {
                    if( $( divID() ).find( stickyID() ).length == 0 )
                    {
                        $( '<table>' ).addClass( sticky ).css({'position': 'fixed', 'width': 'auto', 'display': 'none'}).appendTo( $( divID() ) );
                    }

                    $( window ).resize(
                        function ()
                        {
                            build_sticky_corn( $( stickyID() ), $( originID() ), $( colsID() ) );
                        }
                    );

                    $( window ).scroll(
                        function ()
                        {
                            build_sticky_corn( $( stickyID() ), $( originID() ), $( colsID() ) );
                        }
                    );
                }

            }

            function build_sticky_corn( toTable, fromTable, colsTable )
            {
                if( fromTable.length > 0 && toTable.length > 0 )
                {
                    var stickyCol = fromTable.find( '.' + pvaOptions.sticky_col );
                    if( stickyCol.length == 0 )
                    {
                        toTable.hide();
                        toTable.empty();
                        return;
                    }

                    var toolbarHeight = 0;
                    var toolbar = $( '#toolbar' );
                    if( toolbar.length > 0 )
                    {
                        toolbarHeight = toolbar.height() ? toolbar.height() : 0;
                    }

                    var scrollLeft     = $(this).scrollLeft();
                    var scrollTop      = $(this).scrollTop() + toolbarHeight;

                    var fromOffset     = fromTable.offset();
                    var fromOffsetLeft = fromOffset ? fromOffset.left : 0;
                    var fromOffsetTop  = fromOffset ? fromOffset.top  : 0;

                    if( scrollLeft >= fromOffsetLeft && scrollTop >= fromOffsetTop )
                    {
                        if( toTable.children().length == 0 )
                        {
                            fromTable.find( 'thead' ).clone( true ).appendTo( toTable );

                            toTable.find( 'thead tr' )
                                .each(
                                    function()
                                    {
                                        $( this ).children().each(
                                            function( nCol )
                                            {
                                                var cell = $( this );
                                                if( nCol > stickyCol[0].cellIndex )
                                                {
                                                    cell.remove();
                                                }
                                            }
                                        );
                                    }
                                );
                            copy_thead_sizes( toTable, fromTable );
                        }
                        toTable.css( 'height', fromTable.find( 'thead' ).height() + 1 );
                        toTable.css( 'width', colsTable.width() );

                        toTable.css( 'top', toolbarHeight );
                        toTable.css( 'margin-left', -fromOffsetLeft );

                        if( toTable.is( ':hidden' ) )
                        {
                            toTable.show();
                        }
                    }
                    else
                    if( scrollLeft >= fromOffsetLeft )
                    {
                        if( toTable.children().length == 0 )
                        {
                            fromTable.find( 'thead' ).clone( true ).appendTo( toTable );

                            toTable.find( 'thead tr' )
                                .each(
                                    function()
                                    {
                                        $( this ).children().each(
                                            function( nCol )
                                            {
                                                var cell = $( this );
                                                if( nCol > stickyCol[0].cellIndex )
                                                {
                                                    cell.remove();
                                                }
                                            }
                                        );
                                    }
                                );
                            copy_thead_sizes( toTable, fromTable );
                        }
                        toTable.css( 'height', fromTable.find( 'thead' ).height() + 1 );
                        toTable.css( 'width', colsTable.width() );

                        toTable.css( 'top', fromOffsetTop - $(document).scrollTop() );
                        toTable.css( 'margin-left', -fromOffsetLeft );

                        if( toTable.is( ':hidden' ) )
                        {
                            toTable.show();
                        }
                    }
                    else
                    {
                        toTable.hide();
                        toTable.empty();
                    }
                }
            }






            // ++++++ STICKY COLUMNS +++++++
            //

            function init_sticky_cols( sticky, pConfig )
            {
                var stickyID = function () { return '.' + sticky; };
                var originID = function () { return '.' + pConfig.sID; };
                var divID    = function () { return '#' + pConfig.sID; };

                var originTable = $( originID() );
                if( originTable.length > 0 )
                {
                    if( $( divID() ).find( stickyID() ).length == 0 )
                    {
                        $( '<table>' ).addClass( sticky ).css({'position': 'fixed', 'width': 'auto', 'display': 'none'}).appendTo( $( divID() ) );
                    }

                    $( window ).resize(
                        function ()
                        {
                            build_sticky_cols( $( stickyID() ), $( originID() ) );
                        }
                    );

                    $( window ).scroll(
                        function ()
                        {
                            build_sticky_cols( $( stickyID() ), $( originID() ) );
                        }
                    );
                }

            }

            function build_sticky_cols( toTable, fromTable )
            {
                if( fromTable.length > 0 && toTable.length > 0 )
                {
                    var stickyCol = fromTable.find( '.' + pvaOptions.sticky_col );
                    if( stickyCol.length == 0 )
                    {
                        toTable.hide();
                        toTable.empty();
                        return;
                    }

                    var toolbarHeight = 0;
                    var toolbar = $( '#toolbar' );
                    if( toolbar.length > 0 )
                    {
                        toolbarHeight = toolbar.height() ? toolbar.height() : 0;
                    }

                    var scrollTop      = $(this).scrollTop() + toolbarHeight;
                    var scrollLeft     = $(this).scrollLeft();

                    var fromOffset     = fromTable.offset();
                    var fromOffsetTop  = fromOffset ? fromOffset.top  : 0;
                    var fromOffsetLeft = fromOffset ? fromOffset.left : 0;

                    var tbodyOffset    = fromTable.find('tbody').offset();
                    var tbodyOffsetTop = tbodyOffset ? tbodyOffset.top : 0;

                    if( (scrollLeft >= fromOffsetLeft && scrollTop >= fromOffsetTop) || scrollLeft >= fromOffsetLeft )
                    {
                        if( toTable.children().length == 0 )
                        {
                            fromTable.find( 'tbody' ).clone( true ).appendTo( toTable );

                            toTable.find( 'tbody tr' )
                                .each(
                                    function()
                                    {
                                        $( this ).children().each(
                                            function( nCol )
                                            {
                                                var cell = $( this );
                                                if( nCol > stickyCol[0].cellIndex )
                                                {
                                                    cell.remove();
                                                }
                                            }
                                        );
                                    }
                                );

                            copy_tbody_sizes( toTable, fromTable );
                        }
                        toTable.css( 'height', fromTable.find('tbody').height() + 2.3 );

                        toTable.css( 'top', tbodyOffsetTop - $(document).scrollTop() - 1 );
                        toTable.css( 'margin-left', -fromOffsetLeft );

                        if( toTable.is( ':hidden' ) )
                        {
                            toTable.show();
                        }
                    }
                    else
                    {
                        toTable.hide();
                        toTable.empty();
                    }
                }
            }









            // ++++++ STICKY HEADER ROWS +++++++
            //
            function init_sticky_rows( sticky, pConfig )
            {
                var stickyID = function () { return '.' + sticky; };
                var originID = function () { return '.' + pConfig.sID; };
                var divID    = function () { return '#' + pConfig.sID; };

                var originTable = $( originID() );
                if( originTable.length > 0 )
                {
                    if( $( divID() ).find( stickyID() ).length == 0 )
                    {
                        $( '<table>' ).addClass( sticky ).css({'position': 'fixed', 'width': 'auto', 'display': 'none'}).appendTo( $( divID() ) );
                    }

                    $( window ).resize(
                        function ()
                        {
                            build_sticky_rows( $( stickyID() ), $( originID() ) )
                        }
                    );

                    $( window ).scroll(
                        function ()
                        {
                            build_sticky_rows( $( stickyID() ), $( originID() ) )
                        }
                    );
                }
            }

            function build_sticky_rows( toTable, fromTable )
            {
                if( fromTable.length > 0 && toTable.length > 0 )
                {
                    var toolbarHeight = 0;
                    var toolbar = $( '#toolbar' );
                    if( toolbar.length > 0 )
                    {
                        toolbarHeight = toolbar.height() ? toolbar.height() : 0;
                    }

                    var scrollTop     = $(this).scrollTop() + toolbarHeight;

                    var fromOffset    = fromTable.offset();
                    var fromOffsetTop = fromOffset ? fromOffset.top : 0;

                    if( scrollTop >= fromOffsetTop )
                    {
                        if( toTable.children().length == 0 )
                        {
                            fromTable.find( 'thead' ).clone().appendTo( toTable );

                            copy_thead_sizes( toTable, fromTable );

                            toTable.css( 'width', fromTable.width() );
                        }

                        toTable.css( 'top', toolbarHeight );
                        toTable.css( 'left', fromOffset.left - $(document).scrollLeft() );

                        if( toTable.is( ':hidden' ) )
                        {
                            toTable.show();
                        }
                    }
                    else
                    {
                        toTable.hide();
                        toTable.empty();
                    }
                }
            }





            function copy_thead_sizes( toTable, fromTable )
            {
                toTable.find( 'thead tr' )
                    .each(
                        function( row )
                        {
                            $( this ).children().each(
                                function( col )
                                {
                                    var cell = $( this );
                                    var from = fromTable.find( "thead>tr:nth-child(" + (row+1).toString() + ")>th:nth-child(" + (col+1).toString() + ")" );
                                    cell.css( 'width', from.width() );
                                    cell.css( 'height', from.height() );
                                }
                            );
                        }
                    );
            }

            function copy_tbody_sizes( toTable, fromTable )
            {
                toTable.find( 'tbody tr' )
                    .each(
                        function( row )
                        {
                            $( this ).children().each(
                                function( col )
                                {
                                    var cell = $( this );
                                    var from = fromTable.find( "tbody>tr:nth-child(" + (row+1).toString() + ")>td:nth-child(" + (col+1).toString() + ")" );
                                    cell.css( 'width', from.width() );
                                    cell.css( 'height', from.height() );
                                }
                            );
                        }
                    );
            }

            function closest( el, selector )
            {
                var matchesFn;

                [ 'matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector' ].some(
                    function( fn )
                    {
                        if( typeof document.body[ fn ] == 'function' )
                        {
                            matchesFn = fn;
                            return true;
                        }
                        return false;
                    }
                );

                while( el )
                {
                    el = el.parentElement;
                    if( el )
                    {
                        for( var i = 0, n = selector.length; i < n; i ++ )
                        {
                            if( el[ matchesFn ]( selector[ i ] ) )
                            {
                                return el;
                            }
                        }
                    }
                }

                return null;
            }



            function init_dnd_cols( table )
            {
                var optionsDnD =
                {
                      dragClass : 'drag-column'
                    , overClass : 'over-column'
                };

                var $table = table, dragSrcEl = null, dragSrcEnter = null/*, cursor = null*/;

                if( isIE() === 9 )
                {
                    table.find( 'thead tr th' ).each(
                        function()
                        {
                            if( $(this).find( '.drag-ie' ).length === 0 )
                            {
                                $(this).html(
                                    $('<a>').html( $(this).html() ).attr( 'href', '#' ).addClass( 'drag-ie' )
                                );
                            }
                        }
                    );
                }

                var cols = table.find( 'thead tr th' );

                [].forEach.call( cols,
                    function( col )
                    {
                        col.setAttribute( 'draggable', true );

                        var _col = $( col );
                        _col.bind( 'dragstart', dragstart );
                        _col.bind( 'dragenter', dragenter );
                        _col.bind( 'dragover' , dragover  );
                        _col.bind( 'dragleave', dragleave );
                        _col.bind( 'drop'     , drop      );
                        _col.bind( 'dragend'  , dragend   );
                    }
                );

                jQuery.event.props.push( 'dataTransfer' );

                function dragstart( e )
                {
                    $(this).addClass( optionsDnD.dragClass );
                    dragSrcEl = this;

                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData( 'text/html', this.id );

                    //cursor = e.target.style.cursor;
                    //e.target.style.cursor = 'move';
                }
                function dragover( e )
                {
                    if( e.preventDefault )
                    {
                        e.preventDefault();
                    }
                    e.dataTransfer.dropEffect = 'move';
                }
                function dragenter( e )
                {
                    dragSrcEnter = this;
                    [].forEach.call( cols,
                        function ( col )
                        {
                            $(col).removeClass( optionsDnD.overClass );
                        }
                    );
                    $(this).addClass( optionsDnD.overClass );
                }
                function dragleave( e )
                {
                    if( dragSrcEnter !== e )
                    {
                        moveColumns( $(dragSrcEnter).index(), $(dragSrcEl).index() );
                    }
                }
                function drop( e )
                {
                    if( e.stopPropagation )
                    {
                        e.stopPropagation();
                    }

                    if( dragSrcEl !== e )
                    {
                        moveColumns( $( dragSrcEl ).index(), $(this).index() );
                    }
                }
                function dragend( e )
                {
                    var colPositions = {
                        array  : [],
                        object : {}
                    };

                    [].forEach.call( cols,
                        function (col)
                        {
                            var name = $(col).attr('data-name') || $(col).index();
                            $(col).removeClass( optionsDnD.overClass );
                            colPositions.object[name] = $(col).index();
                            colPositions.array.push( $(col).index() );
                        }
                    );

                    $(dragSrcEl).removeClass( optionsDnD.dragClass );

                    //e.target.style.cursor = cursor;
                }

                function moveColumns( fromIndex, toIndex )
                {
                    var rows = $table.find( 'tr' );
                    for( var i = 0, n = rows.length; i < n; i ++ )
                    {
                        var item = rows[ i ];
                        if( toIndex > fromIndex )
                        {
                            insertAfter( item.children[ fromIndex ], item.children[ toIndex ] );
                        }
                        else
                        if( toIndex < $table.find( 'thead tr th' ).length - 1 )
                        {
                            item.insertBefore( item.children[ fromIndex ], item.children[ toIndex ] );
                        }
                    }
                }

                function insertAfter(elem, refElem)
                {
                    return refElem.parentNode.insertBefore(elem, refElem.nextSibling);
                }

                function isIE ()
                {
                    var nav = navigator.userAgent.toLowerCase();
                    return (nav.indexOf('msie') !== -1) ? parseInt(nav.split('msie')[1]) : false;
                }

            }

        }
    );
})(jQuery, window);
