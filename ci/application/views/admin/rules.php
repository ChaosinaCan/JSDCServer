<?php

?>

<nav class="tabs">
    <a href="#scoring">Scoring</a>
    <a href="#general">General</a>
</nav>

<div class="tab-body">

    <div id="scoring">
        <div>
            <h2>Actions</h2>
            <table id="action-list">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>From value</th>
                        <th>On value</th>
                        <th></th>
                    </tr>
                </thead>
            </table>
            <button id="new-action">New action</button>
            <button id="save-actions">Save changes</button>
        </div>

        <div>
            <h2>Fouls</h2>
            <table id="foul-list">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Value</th>
                        <th></th>
                    </tr>
                </thead>
            </table>
            <button id="new-foul">New foul</button>
            <button id="save-fouls">Save changes</button>
        </div>
    </div><!-- #scoring -->

    <div id="general">
        <div>
            <h2>Match settings</h2>
            <p>
                <label for="teams-per-match">Teams per match</label>
                <input id="teams-per-match" type="number" min="1" step="1"/>
            </p>
            <p>
                <label for="qualify-rounds"># Qualification rounds</label>
                <input id="qualify-rounds" type="number" min="1" step="1"/>
            </p>
            <p>
                <label for="elimination-rounds"># Elimination rounds</label>
                <input id="elimination-rounds" type="number" min="1" step="1"/>
            </p>
            <p>
                <label for="max-matches">Max matches per round</label>
                <input id="max-matches" type="number" min="1" step="1"/>
            </p>
            <button id="save-matches">Save changes</button>
        </div>

        <div>
            <h2>Colors</h2>
            <table id="color-list">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Color</th>
                        <th></th>
                    </tr>
                </thead>
            </table>
            <button id="new-color">New color</button>
            <button id="save-colors">Save changes</button>
        </div>
    </div><!-- #general -->
</div><!-- .tab-body -->