// **************
// DISPLAY CONFIG
// **************

const UNARY_CONNECTORS = {
    'negation': '¬',
    'ofcourse': '!',
    'whynot': '?'
};

const BINARY_CONNECTORS = {
    'implication': '<span class="binary-connector">→</span>',
    'conjunction': '<span class="binary-connector">∧</span>',
    'disjunction': '<span class="binary-connector">∨</span>',
    'tensor': '<span class="binary-connector">⊗</span>',
    'par': '<span class="binary-connector flip">&</span>',
    'with': '<span class="binary-connector">&</span>',
    'plus': '<span class="binary-connector">⊕</span>',
    'lollipop': '<span class="binary-connector">⊸</span>'
};

const NEUTRAL_ELEMENTS = {
    'true': 'true',
    'false': 'false',
    'one': '1',
    'bottom': '⊥',
    'top': '⊤',
    'zero': '0'
};

// ***************
// DISPLAY SEQUENT
// ***************

function createSequent(sequent, $sequentTable, options) {
    let $sequentDiv = $('<div>', {'class': 'sequent'});

    if ('hyp' in sequent) {
        createFormulaList(sequent, 'hyp', $sequentDiv, options);
    }

    let $thesisSpan = $('<span class="turnstile">⊢</span>');
    if (options.withInteraction) {
        $thesisSpan.addClass('clickable');
        addClickAndDoubleClickEvent($thesisSpan, function () {
            applyRule({rule: 'axiom'}, $sequentTable);
        }, function () {
            autoProveSequent($sequentTable);
        });
    }
    $sequentDiv.append($thesisSpan);

    if ('cons' in sequent) {
        createFormulaList(sequent, 'cons', $sequentDiv, options);
    }

    return $sequentDiv;
}

function createFormulaList(sequent, sequentPart, $sequentDiv, options) {
    let $firstPoint = $('<span>', {'class': 'first-point'});
    $sequentDiv.append($firstPoint);

    let $ul = $('<ul>', {'class': ['commaList ' + sequentPart]});
    $sequentDiv.append($ul);

    if (options.withInteraction) {
        $ul.sortable({
            helper : 'clone',
            axis: 'x',
            opacity: 0.2,
            start: function(e, ui){
                ui.placeholder.width(ui.item.width());
            }
        });
        addCutOnClick($firstPoint, true);
    }

    for (let i = 0; i < sequent[sequentPart].length; i++) {
        let formulaAsJson = sequent[sequentPart][i];
        let $li = $('<li>').data('initialPosition', i);
        $ul.append($li);

        // Build formula
        let $span = $('<span>', {'class': 'main-formula'})
            .html(createFormulaHTML(formulaAsJson, true));
        $li.append($span);
        let $commaSpan = $('<span>', {'class': 'comma'});
        $li.append($commaSpan);

        if (options.withInteraction) {
            // Add events (click, double-click), and classes for hover
            addEventsAndStyle($li, formulaAsJson);
            addCutOnClick($commaSpan, false);
        }
    }
}

function createFormulaHTML(formulaAsJson, isMainFormula = true) {
    switch (formulaAsJson.type) {
        case 'litt':
            return formulaAsJson.value.replace(/\d+/, digits => `<sub>${digits}</sub>`);

        case 'one':
        case 'bottom':
        case 'top':
        case 'zero':
            let neutralElement = NEUTRAL_ELEMENTS[formulaAsJson.type];
            if (isMainFormula) {
                return `<span class="primaryConnector">${neutralElement}</span>`;
            }
            return neutralElement;

        case 'negation':
            return UNARY_CONNECTORS[formulaAsJson.type] + createFormulaHTML(formulaAsJson.value, false);

        case 'ofcourse':
        case 'whynot':
            let unaryConnector = UNARY_CONNECTORS[formulaAsJson.type];
            let subFormula = createFormulaHTML(formulaAsJson.value, false);
            if (isMainFormula) {
                unaryConnector = `<span class="primaryConnector">${unaryConnector}</span>`;
                subFormula = `<span class="sub-formula">${subFormula}</span>`;
            }
            return unaryConnector + subFormula;

        case 'dual':
            return createFormulaHTML(formulaAsJson.value, false)
                + '<sup>⊥</sup>';

        case 'implication':
        case 'conjunction':
        case 'disjunction':
        case 'tensor':
        case 'par':
        case 'with':
        case 'plus':
        case 'lollipop':
            let connector = BINARY_CONNECTORS[formulaAsJson.type];
            if (isMainFormula) {
                connector = `<span class="primaryConnector">${connector}</span>`;
            }

            let leftFormula = createFormulaHTML(formulaAsJson['value1'], false);
            let rightFormula = createFormulaHTML(formulaAsJson['value2'], false);
            if (isMainFormula) {
                leftFormula = `<span class="left-formula">${leftFormula}</span>`;
                rightFormula = `<span class="right-formula">${rightFormula}</span>`;
            }
            let formula = leftFormula + connector + rightFormula;

            if (!isMainFormula) {
                return `(${formula})`;
            }

            return formula;

        default:
            console.error('No display rule for type ' + formulaAsJson.type);
            return '';
    }
}

// *****
// RULES
// *****

function getRules(formulaAsJson) {
    switch (formulaAsJson.type) {
        case 'litt':
        case 'dual':
            return [{'element': 'main-formula', 'onclick': [{'rule': 'axiom', 'needPosition': false}]}];

        case 'tensor':
        case 'par':
        case 'with':
            return [{'element': 'main-formula', 'onclick': [{'rule': formulaAsJson.type, 'needPosition': true}]}];

        case 'plus':
            return [
                {'element': 'left-formula', 'onclick': [{'rule': 'plus_left', 'needPosition': true}]},
                {'element': 'right-formula', 'onclick': [{'rule': 'plus_right', 'needPosition': true}]}
            ];

        case 'one':
        case 'zero': // click on zero will display a pedagogic error
            return [{'element': 'main-formula', 'onclick': [{'rule': formulaAsJson.type, 'needPosition': false}]}];

        case 'top':
        case 'bottom':
            return [{'element': 'main-formula', 'onclick': [{'rule': formulaAsJson.type, 'needPosition': true}]}];

        case 'ofcourse':
            return [{'element': 'main-formula', 'onclick': [{'rule': 'promotion', 'needPosition': true}]}];

        case 'whynot':
            return [
                {'element': 'primaryConnector', 'onclick': [
                    {'rule': 'weakening', 'needPosition': true},
                    {'rule': 'contraction', 'needPosition': true}
                ]},
                {'element': 'sub-formula', 'onclick': [
                    {'rule': 'dereliction', 'needPosition': true},
                    {'rule': 'contraction', 'needPosition': true}
                ]}
            ];

        default:
            return [];
    }
}

function addEventsAndStyle($li, formulaAsJson) {
    $li.find('span.' + 'main-formula').first().addClass('hoverable');

    let rules = getRules(formulaAsJson);
    for (let ruleEvent of rules) {
        let $spanForEvent = $li.find('span.' + ruleEvent.element).first();

        // Some hover config
        $spanForEvent.addClass('clickable');
        if (ruleEvent.element !== 'main-formula') {
            $spanForEvent.addClass('highlightableExpr');
        }

        // Some hover config for tensor
        if (ruleEvent.onclick[0] === 'tensor') {
            $li.find('span' + '.left-formula').first().addClass('tensor-left');
            $li.find('span' + '.right-formula').first().addClass('tensor-right');
        }

        // Add click and double click events
        if (ruleEvent.onclick.length === 1) {
            // Single click
            $spanForEvent.on('click', buildApplyRuleCallBack(ruleEvent.onclick[0], $li));
        } else {
            // Single click AND Double click event
            let singleClickCallBack = buildApplyRuleCallBack(ruleEvent.onclick[0], $li);
            let doubleClickCallBack = buildApplyRuleCallBack(ruleEvent.onclick[1], $li);

            addClickAndDoubleClickEvent($spanForEvent, singleClickCallBack, doubleClickCallBack);
        }
    }
}

function buildApplyRuleCallBack(ruleConfig, $li) {
    return function() {
        let $sequentTable = $li.closest('table');
        let ruleRequest = {rule: ruleConfig.rule};

        if (ruleConfig.needPosition) {
            ruleRequest['formulaPosition'] = $li.parent().children().index($li);
        }

        applyRule(ruleRequest, $sequentTable);
    }
}

// ******************
// DOUBLE CLICK EVENT
// ******************

const CLICK_DELAY = 200;
window.clickCount = 0;
window.clickTimer = null;

function addClickAndDoubleClickEvent ($element, singleClickCallBack, doubleClickCallBack) {
    // https://stackoverflow.com/a/7845282
    $element.on('click', function () {
        clickCount++;
        if (clickCount === 1) {
            window.clickTimer = setTimeout(function () {
                singleClickCallBack();
                window.clickCount = 0;
            }, CLICK_DELAY);
        } else {
            clearTimeout(window.clickTimer);
            doubleClickCallBack();
            window.clickCount = 0;
        }
    })
}

// *******************
// FORMULA PERMUTATION
// *******************

function getSequentPermutation($sequentTable) {
    return {
        'hyp': getFormulasPermutation($sequentTable.find('ul.hyp')),
        'cons': getFormulasPermutation($sequentTable.find('ul.cons'))
    };
}

function getFormulasPermutation($ul) {
    let permutation = [];

    $ul.find('li').each(function(i, obj) {
        let initialPosition = $(obj).data('initialPosition');
        permutation.push(initialPosition);
    })

    return permutation;
}

function getSequentIdentityPermutation(sequent) {
    return {
        'hyp': getFormulaListIdentityPermutation(sequent['hyp'] || []),
        'cons': getFormulaListIdentityPermutation(sequent['cons'] || [])
    };
}

function getFormulaListIdentityPermutation(formulaList) {
    return identity(formulaList.length);
}

function identity(n) {
    return [...Array(n).keys()];
}

function permuteSequent(sequentWithoutPermutation, sequentPermutation) {
    return {
        'hyp': permute(sequentWithoutPermutation['hyp'], sequentPermutation['hyp']),
        'cons': permute(sequentWithoutPermutation['cons'], sequentPermutation['cons'])
    };
}

function permute(formulasWithoutPermutation, formulasPermutation) {
    let newFormulas = [];

    for (let initialPosition of formulasPermutation) {
        newFormulas.push(formulasWithoutPermutation[initialPosition]);
    }

    return newFormulas;
}

// ******************
// AUTO-PROVE SEQUENT
// ******************

function autoProveSequent($sequentTable) {
    if ($sequentTable.data('notProvable') === true || $sequentTable.data('notAutoProvable') === true) {
        return;
    }

    let $container = $sequentTable.closest('.proof-container');
    let options = $container.data('options');

    // Sequent json that was stored in div may have been permuted before rule applying
    let sequentWithoutPermutation = $sequentTable.data('sequentWithoutPermutation');
    let permutationBeforeRule = getSequentPermutation($sequentTable);
    let sequent = permuteSequent(sequentWithoutPermutation, permutationBeforeRule);

    let $turnstile = $sequentTable.find('.turnstile');

    $.ajax({
        type: 'POST',
        url: '/auto_prove_sequent',
        contentType:'application/json; charset=utf-8',
        data: compressJson(JSON.stringify(sequent)),
        beforeSend: function() {
            $turnstile.addClass('loading');
        },
        complete: function(){
            $turnstile.removeClass('loading');
        },
        success: function(data)
        {
            if (data.success) {
                clearSavedProof();
                cleanPedagogicMessage($container);
                let $sequentContainer = removeSequentTable($sequentTable);
                createSubProof(data['proof'], $sequentContainer, options);
            } else {
                if (data['is_provable']) {
                    markAsNotAutoProvable($sequentTable);
                } else {
                    recMarkAsNotProvable($sequentTable);
                }
            }
        },
        error: onAjaxError
    });
}

function markAsNotAutoProvable($sequentTable) {
    $sequentTable.data('notAutoProvable', true);
    let $turnstile = $sequentTable.find('span.turnstile');
    $turnstile.addClass('not-auto-provable');
    $turnstile.attr('title', 'The automatic prover did not make it on this sequent');
}

function undoMarkAsNotAutoProvable($sequentTable) {
    $sequentTable.data('notAutoProvable', null);
    let $turnstile = $sequentTable.find('span.turnstile');
    $turnstile.removeClass('not-auto-provable');
    $turnstile.removeAttr('title');
}