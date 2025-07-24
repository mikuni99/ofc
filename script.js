// OpenFace Chinese Poker 点数計算アプリ

// 役のボーナス点数定義
const BONUS_POINTS = {
    // トップ（3枚）のボーナス
    top: {
        'three-of-a-kind': 22, // AAA = 22, KKK = 21, ... 222 = 10
        'pair': 1 // AA = 9, KK = 8, ... 22 = 1
    },
    // ミドル（5枚）のボーナス
    middle: {
        'straight-flush': 50,
        'four-of-a-kind': 20,
        'full-house': 2,
        'flush': 4,
        'straight': 2
    },
    // ボトム（5枚）のボーナス
    bottom: {
        'straight-flush': 25,
        'four-of-a-kind': 10,
        'full-house': 0,
        'flush': 0,
        'straight': 0
    }
};

// 役名の日本語表示
const HAND_NAMES = {
    'straight-flush': 'ストレートフラッシュ',
    'four-of-a-kind': 'フォーカード',
    'full-house': 'フルハウス',
    'flush': 'フラッシュ',
    'straight': 'ストレート',
    'three-of-a-kind': 'スリーカード',
    'two-pair': 'ツーペア',
    'pair': 'ペア',
    'high-card': 'ハイカード'
};

// プレイヤー数変更時の処理
document.getElementById('playerCount').addEventListener('change', function() {
    const playerCount = parseInt(this.value);
    const player3Card = document.getElementById('player3');
    
    if (playerCount === 3) {
        player3Card.style.display = 'block';
    } else {
        player3Card.style.display = 'none';
    }
});

// 計算ボタンのイベントリスナー
document.getElementById('calculateBtn').addEventListener('click', calculateScores);

function calculateScores() {
    try {
        const playerCount = parseInt(document.getElementById('playerCount').value);
        const players = [];
        
        // プレイヤーデータの収集
        for (let i = 1; i <= playerCount; i++) {
            const player = {
                id: i,
                name: `プレイヤー${i}`,
                hands: {
                    top: document.getElementById(`p${i}-top-hand`).value,
                    middle: document.getElementById(`p${i}-middle-hand`).value,
                    bottom: document.getElementById(`p${i}-bottom-hand`).value
                },
                foul: document.getElementById(`p${i}-foul`).checked,
                scores: { basic: 0, bonus: 0, total: 0 },
                bonuses: []
            };
            players.push(player);
        }
        
        // 各プレイヤーのボーナス計算
        players.forEach(player => {
            if (!player.foul) {
                calculateBonuses(player);
            }
        });
        
        // 対戦計算
        const results = [];
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const result = calculateMatch(players[i], players[j]);
                results.push(result);
            }
        }
        
        // 結果の表示
        displayResults(players, results);
        
    } catch (error) {
        displayError('計算中にエラーが発生しました: ' + error.message);
    }
}

function calculateBonuses(player) {
    player.bonuses = [];
    player.scores.bonus = 0;
    
    // トップのボーナス
    if (player.hands.top) {
        const bonus = getTopBonus(player.hands.top);
        if (bonus > 0) {
            player.bonuses.push({
                position: 'トップ',
                hand: HAND_NAMES[player.hands.top],
                points: bonus
            });
            player.scores.bonus += bonus;
        }
    }
    
    // ミドルのボーナス
    if (player.hands.middle && BONUS_POINTS.middle[player.hands.middle]) {
        const bonus = BONUS_POINTS.middle[player.hands.middle];
        player.bonuses.push({
            position: 'ミドル',
            hand: HAND_NAMES[player.hands.middle],
            points: bonus
        });
        player.scores.bonus += bonus;
    }
    
    // ボトムのボーナス
    if (player.hands.bottom && BONUS_POINTS.bottom[player.hands.bottom]) {
        const bonus = BONUS_POINTS.bottom[player.hands.bottom];
        if (bonus > 0) {
            player.bonuses.push({
                position: 'ボトム',
                hand: HAND_NAMES[player.hands.bottom],
                points: bonus
            });
            player.scores.bonus += bonus;
        }
    }
}

function getTopBonus(handType) {
    if (handType === 'three-of-a-kind') {
        return 22; // 簡略化：実際にはカードの強さで変動
    } else if (handType === 'pair') {
        return 1; // 簡略化：実際にはカードの強さで変動
    }
    return 0;
}

function calculateMatch(player1, player2) {
    let p1Score = 0;
    let p2Score = 0;
    let p1Details = [];
    let p2Details = [];
    
    // ファウルチェック
    if (player1.foul && player2.foul) {
        // 両方ファウル：引き分け
        return {
            player1: player1.name,
            player2: player2.name,
            p1Score: 0,
            p2Score: 0,
            details: '両者ファウル'
        };
    } else if (player1.foul) {
        // プレイヤー1がファウル
        p2Score = 6; // ファウルペナルティ
        p2Details.push('ファウル勝利: +6');
        return {
            player1: player1.name,
            player2: player2.name,
            p1Score: -6,
            p2Score: 6,
            details: `${player1.name}がファウル`
        };
    } else if (player2.foul) {
        // プレイヤー2がファウル
        p1Score = 6; // ファウルペナルティ
        p1Details.push('ファウル勝利: +6');
        return {
            player1: player1.name,
            player2: player2.name,
            p1Score: 6,
            p2Score: -6,
            details: `${player2.name}がファウル`
        };
    }
    
    // 通常の対戦計算
    const handComparison = compareHands(player1, player2);
    
    // 基本点計算
    let basicPoints = 0;
    let p1Wins = 0;
    let p2Wins = 0;
    
    ['top', 'middle', 'bottom'].forEach(position => {
        if (handComparison[position] > 0) {
            basicPoints += 1;
            p1Wins++;
        } else if (handComparison[position] < 0) {
            basicPoints -= 1;
            p2Wins++;
        }
    });
    
    // スクープボーナス（3つ全勝利）
    if (p1Wins === 3) {
        basicPoints += 3;
        p1Details.push('スクープ: +3');
    } else if (p2Wins === 3) {
        basicPoints -= 3;
        p2Details.push('スクープ: +3');
    }
    
    p1Score += basicPoints;
    p2Score -= basicPoints;
    
    // ボーナス点の差分
    const bonusDiff = player1.scores.bonus - player2.scores.bonus;
    p1Score += bonusDiff;
    p2Score -= bonusDiff;
    
    if (bonusDiff > 0) {
        p1Details.push(`ボーナス差: +${bonusDiff}`);
    } else if (bonusDiff < 0) {
        p2Details.push(`ボーナス差: +${Math.abs(bonusDiff)}`);
    }
    
    return {
        player1: player1.name,
        player2: player2.name,
        p1Score: p1Score,
        p2Score: p2Score,
        p1Details: p1Details,
        p2Details: p2Details,
        handComparison: handComparison
    };
}

function compareHands(player1, player2) {
    // 簡略化された手札比較
    // 実際のポーカーでは具体的なカードで比較する必要があります
    const comparison = {
        top: 0,
        middle: 0,
        bottom: 0
    };
    
    ['top', 'middle', 'bottom'].forEach(position => {
        const hand1 = player1.hands[position];
        const hand2 = player2.hands[position];
        
        if (hand1 && hand2) {
            const strength1 = getHandStrength(hand1);
            const strength2 = getHandStrength(hand2);
            
            if (strength1 > strength2) {
                comparison[position] = 1;
            } else if (strength1 < strength2) {
                comparison[position] = -1;
            }
        }
    });
    
    return comparison;
}

function getHandStrength(handType) {
    const strengths = {
        'high-card': 1,
        'pair': 2,
        'two-pair': 3,
        'three-of-a-kind': 4,
        'straight': 5,
        'flush': 6,
        'full-house': 7,
        'four-of-a-kind': 8,
        'straight-flush': 9
    };
    
    return strengths[handType] || 0;
}

function displayResults(players, results) {
    const resultsDiv = document.getElementById('results');
    const scoreResultsDiv = document.getElementById('scoreResults');
    const bonusResultsDiv = document.getElementById('bonusResults');
    
    // 対戦結果テーブル
    let scoreTable = '<h3>対戦結果</h3><table class="score-table"><thead><tr><th>対戦</th><th>プレイヤー1</th><th>得点</th><th>プレイヤー2</th><th>得点</th><th>詳細</th></tr></thead><tbody>';
    
    results.forEach(result => {
        const p1Class = result.p1Score > 0 ? 'positive-score' : result.p1Score < 0 ? 'negative-score' : 'zero-score';
        const p2Class = result.p2Score > 0 ? 'positive-score' : result.p2Score < 0 ? 'negative-score' : 'zero-score';
        
        scoreTable += `
            <tr>
                <td>${result.player1} vs ${result.player2}</td>
                <td>${result.player1}</td>
                <td class="${p1Class}">${result.p1Score}</td>
                <td>${result.player2}</td>
                <td class="${p2Class}">${result.p2Score}</td>
                <td>${result.details || ''}</td>
            </tr>
        `;
    });
    
    scoreTable += '</tbody></table>';
    scoreResultsDiv.innerHTML = scoreTable;
    
    // 累計得点計算
    const totalScores = {};
    players.forEach(player => {
        totalScores[player.name] = 0;
    });
    
    results.forEach(result => {
        totalScores[result.player1] += result.p1Score;
        totalScores[result.player2] += result.p2Score;
    });
    
    // 累計得点テーブル
    let totalTable = '<h3>累計得点</h3><table class="score-table"><thead><tr><th>プレイヤー</th><th>累計得点</th></tr></thead><tbody>';
    
    Object.entries(totalScores).forEach(([playerName, score]) => {
        const scoreClass = score > 0 ? 'positive-score' : score < 0 ? 'negative-score' : 'zero-score';
        totalTable += `
            <tr>
                <td>${playerName}</td>
                <td class="${scoreClass}">${score}</td>
            </tr>
        `;
    });
    
    totalTable += '</tbody></table>';
    scoreResultsDiv.innerHTML += totalTable;
    
    // ボーナス詳細
    let bonusHtml = '<h3>役ボーナス詳細</h3>';
    
    players.forEach(player => {
        if (player.bonuses.length > 0) {
            bonusHtml += `<h4>${player.name}</h4>`;
            player.bonuses.forEach(bonus => {
                bonusHtml += `
                    <div class="bonus-item">
                        <span class="bonus-name">${bonus.position} - ${bonus.hand}</span>
                        <span class="bonus-score bonus-positive">+${bonus.points}</span>
                    </div>
                `;
            });
            bonusHtml += `<div class="bonus-item" style="background: #e8f5e8;">
                <span class="bonus-name">合計ボーナス</span>
                <span class="bonus-score bonus-positive">+${player.scores.bonus}</span>
            </div>`;
        } else {
            bonusHtml += `<h4>${player.name}</h4><p>ボーナスなし</p>`;
        }
    });
    
    bonusResultsDiv.innerHTML = bonusHtml;
    resultsDiv.style.display = 'block';
}

function displayError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<div class="error-message">${message}</div>`;
    resultsDiv.style.display = 'block';
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    // プレイヤー3を初期状態で非表示
    document.getElementById('player3').style.display = 'none';
});