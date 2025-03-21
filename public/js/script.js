// Auto refresh player data every 60 seconds
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the player page
    if (document.querySelector('#takim-ct')) {
        // Oyuncu sayfasında yenileme butonunu etkinleştir
        const refreshButton = document.getElementById('refreshPlayers');
        if (refreshButton) {
            refreshButton.addEventListener('click', function() {
                // Yenileme göstergesi ekle
                const refreshIndicator = document.createElement('div');
                refreshIndicator.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                refreshIndicator.innerHTML = '<i class="fas fa-sync-alt fa-spin mr-2"></i> Yenileniyor...';
                document.body.appendChild(refreshIndicator);
                
                // Sunucu verilerini yenile
                fetch('/api/server-status')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Veri alınamadı');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Yeni veriler alındı:', data);
                        
                        // Verileri güncelle ve UI'ı yenile
                        // API'den doğrudan takım verilerini al
                        const ctPlayers = data.ctPlayers || [];
                        const tPlayers = data.tPlayers || [];
                        const spectators = data.spectators || [];
                        
                        // Tabloları güncelle
                        updateTeamTable('takim-ct', ctPlayers, 'CT');
                        updateTeamTable('takim-t', tPlayers, 'T');
                        updateTeamTable('takim-spec', spectators, 'SPEC');
                        
                        // Oyuncu sayısı bilgisini güncelle
                        const playerCountElement = document.querySelector('.flex.items-center p');
                        if (playerCountElement) {
                            playerCountElement.innerHTML = `Toplam <span class="text-green-400 font-bold">${data.players.online}</span> oyuncu aktif - <span class="text-yellow-400">${data.map}</span> haritasında`;
                        }
                        
                        // Takım başlıklarını güncelle
                        updateTeamHeaders(ctPlayers, tPlayers, spectators);
                        
                        // İstatistikleri güncelle
                        updateStatPanels(ctPlayers, tPlayers);
                        
                        // Yenileme göstergesini kaldır
                        setTimeout(() => {
                            refreshIndicator.remove();
                            
                            // Başarılı mesajını göster
                            const successMsg = document.createElement('div');
                            successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                            successMsg.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Veriler güncellendi!';
                            document.body.appendChild(successMsg);
                            
                            // Başarılı mesajını 2 saniye sonra kaldır
                            setTimeout(() => {
                                successMsg.remove();
                            }, 2000);
                        }, 1000);
                    })
                    .catch(error => {
                        console.error('Veri yenileme hatası:', error);
                        
                        // Yenileme göstergesini kaldır ve hata mesajını göster
                        setTimeout(() => {
                            refreshIndicator.remove();
                            
                            // Hata mesajını göster
                            const errorMsg = document.createElement('div');
                            errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                            errorMsg.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Veriler yenilenemedi!';
                            document.body.appendChild(errorMsg);
                            
                            // Hata mesajını 3 saniye sonra kaldır
                            setTimeout(() => {
                                errorMsg.remove();
                            }, 3000);
                        }, 1000);
                    });
            });
        }
        
        // Sıralama butonunu etkinleştir
        const sortButton = document.getElementById('sortButton');
        const sortDropdown = document.getElementById('sortDropdown');
        
        if (sortButton && sortDropdown) {
            // Sıralama menüsünü aç/kapat
            sortButton.addEventListener('click', function() {
                sortDropdown.classList.toggle('hidden');
            });
            
            // Sayfa başka bir yere tıklandığında menüyü kapat
            document.addEventListener('click', function(event) {
                if (!sortButton.contains(event.target) && !sortDropdown.contains(event.target)) {
                    sortDropdown.classList.add('hidden');
                }
            });
            
            // Sıralama seçeneklerine tıklanınca oyuncuları sırala
            const sortOptions = document.querySelectorAll('.sort-option');
            sortOptions.forEach(option => {
                option.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sortBy = this.getAttribute('data-sort');
                    sortPlayerTables(sortBy);
                    sortDropdown.classList.add('hidden');
                });
            });
        }
        
        // 60 saniyede bir otomatik yenile
        setInterval(function() {
            // Yenileme göstergesi ekle
            const refreshIndicator = document.createElement('div');
            refreshIndicator.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50 opacity-75';
            refreshIndicator.innerHTML = '<i class="fas fa-sync-alt fa-spin mr-2"></i> Otomatik Yenileniyor...';
            document.body.appendChild(refreshIndicator);
            
            // Sayfayı yenile (gerçek veri almak için)
            fetch('/api/server-status')
                .then(response => response.json())
                .then(data => {
                    // API'den doğrudan takım verilerini al
                    const ctPlayers = data.ctPlayers || [];
                    const tPlayers = data.tPlayers || [];
                    const spectators = data.spectators || [];
                    
                    // Tabloları güncelle
                    updateTeamTable('takim-ct', ctPlayers, 'CT');
                    updateTeamTable('takim-t', tPlayers, 'T');
                    updateTeamTable('takim-spec', spectators, 'SPEC');
                    
                    // Oyuncu sayısı bilgisini güncelle
                    const playerCountElement = document.querySelector('.flex.items-center p');
                    if (playerCountElement) {
                        playerCountElement.innerHTML = `Toplam <span class="text-green-400 font-bold">${data.players.online}</span> oyuncu aktif - <span class="text-yellow-400">${data.map}</span> haritasında`;
                    }
                    
                    // Takım başlıklarını güncelle
                    updateTeamHeaders(ctPlayers, tPlayers, spectators);
                    
                    // İstatistikleri güncelle
                    updateStatPanels(ctPlayers, tPlayers);
                    
                    // Göstergeyi 2 saniye sonra kaldır
                    setTimeout(() => {
                        refreshIndicator.remove();
                    }, 2000);
                })
                .catch(err => {
                    console.error('Otomatik yenileme hatası:', err);
                    // Göstergeyi kaldır
                    refreshIndicator.remove();
                });
        }, 60000); // 60 saniyede bir yenile
    }
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Add animation to server cards
    const cards = document.querySelectorAll('.bg-gray-800');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('opacity-100', 'translate-y-0');
        }, 100 * index);
    });
    
    // Oyuncu tablolarına hover efekti ekle
    const playerRows = document.querySelectorAll('#takim-ct tbody tr, #takim-t tbody tr, #takim-spec tbody tr');
    playerRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.classList.add('bg-gray-100');
        });
        row.addEventListener('mouseleave', function() {
            this.classList.remove('bg-gray-100');
        });
    });
    
    // Veri yenileme zamanını göster
    const lastUpdated = document.createElement('div');
    lastUpdated.className = 'text-center text-gray-400 text-sm mt-2';
    const now = new Date();
    lastUpdated.innerHTML = `<i class="fas fa-clock mr-1"></i> Son Güncelleme: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const playerData = document.querySelector('.bg-white.shadow-lg');
    if (playerData) {
        playerData.appendChild(lastUpdated);
    }
}); 

// Takım tablolarını güncelle
function updateTeamTable(tableId, players, teamName) {
    const teamElement = document.getElementById(tableId);
    if (!teamElement) return;
    
    const tableBody = teamElement.querySelector('tbody');
    if (!tableBody) {
        console.error(`${teamName} takımı için tablo gövdesi bulunamadı`);
        return;
    }
    
    // Tabloyu temizle
    tableBody.innerHTML = '';
    
    // Takımda oyuncu varsa
    if (players.length > 0) {
        // Oyuncuları tabloya ekle
        players.forEach((player, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-600 border-b border-gray-600 last:border-0';
            
            const kdRatio = player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : player.kills;
            
            // Tabloya göre farklı içerik oluştur
            if (tableId === 'takim-spec') {
                row.innerHTML = `
                    <td class="text-center p-2">${index + 1}</td>
                    <td class="p-2 flex items-center">
                        <span class="w-2 h-2 bg-gray-500 rounded-full inline-block mr-2"></span>
                        ${player.name}
                    </td>
                    <td class="text-center p-2">
                        <span class="${player.ping < 100 ? 'text-green-400' : (player.ping < 200 ? 'text-yellow-400' : 'text-red-400')}">
                            ${player.ping} ms
                        </span>
                    </td>
                    <td class="text-center p-2 text-gray-400">${player.time || '0:00'}</td>
                `;
            } else {
                row.innerHTML = `
                    <td class="text-center p-2">${index + 1}</td>
                    <td class="p-2 flex items-center">
                        <span class="w-2 h-2 bg-green-500 rounded-full inline-block mr-2"></span>
                        ${player.name}
                    </td>
                    <td class="text-center p-2">${player.score}</td>
                    <td class="text-center p-2 text-green-400">${player.kills}</td>
                    <td class="text-center p-2 text-red-400">${player.deaths}</td>
                    <td class="text-center p-2">
                        <span class="${kdRatio >= 1 ? 'text-green-400' : 'text-red-400'}">${kdRatio}</span>
                    </td>
                    <td class="text-center p-2">
                        <span class="${player.ping < 100 ? 'text-green-400' : (player.ping < 200 ? 'text-yellow-400' : 'text-red-400')}">
                            ${player.ping} ms
                        </span>
                    </td>
                `;
            }
            
            tableBody.appendChild(row);
        });
    } else {
        // Takımda oyuncu yoksa, mesaj göster
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="${tableId === 'takim-spec' ? '4' : '7'}" class="text-center p-4">
                <p class="text-gray-400"><i class="fas fa-user-slash mr-2"></i> Bu takımda aktif oyuncu yok</p>
            </td>
        `;
        tableBody.appendChild(emptyRow);
    }
    
    // Takım boş uyarılarını güncelle
    const noPlayersMessage = teamElement.querySelector('.no-players-message');
    if (players.length === 0) {
        // Takımda oyuncu yoksa, mesaj göster
        if (!noPlayersMessage) {
            const tableContainer = teamElement.querySelector('.bg-gray-700.p-4');
            if (tableContainer) {
                const message = document.createElement('div');
                message.className = 'no-players-message p-4 text-center text-gray-500';
                message.innerHTML = `<i class="fas fa-user-slash mr-2"></i>${teamName} Takımında oyuncu yok.`;
                tableContainer.appendChild(message);
            }
        }
    } else {
        // Takımda oyuncu varsa, mesajı kaldır
        if (noPlayersMessage) {
            noPlayersMessage.remove();
        }
    }
}

// Takım başlıklarını güncelle
function updateTeamHeaders(ctPlayers, tPlayers, spectators) {
    // CT Takım başlığı
    const ctHeader = document.querySelector('#takim-ct .bg-blue-900\\/30 h3');
    if (ctHeader) {
        ctHeader.textContent = `Counter-Terrorist Team (${ctPlayers.length} oyuncu)`;
    }
    
    // T Takım başlığı
    const tHeader = document.querySelector('#takim-t .bg-red-900\\/30 h3');
    if (tHeader) {
        tHeader.textContent = `Terrorist Team (${tPlayers.length} oyuncu)`;
    }
    
    // İzleyici başlığı
    const specHeader = document.querySelector('#takim-spec .bg-gray-600 h3');
    if (specHeader) {
        specHeader.textContent = `İzleyiciler (${spectators.length} kişi)`;
    }
}

// Oyuncuları sırala
function sortPlayerTables(sortBy) {
    const tables = ['takim-ct', 'takim-t', 'takim-spec'];
    
    tables.forEach(tableId => {
        const tableElement = document.getElementById(tableId);
        if (!tableElement) return;
        
        const tableRows = Array.from(tableElement.querySelectorAll('tbody tr'));
        if (tableRows.length <= 1) return; // Sıralanacak birden fazla satır yoksa devam etme
        
        // Satırları belirtilen kritere göre sırala
        tableRows.sort((a, b) => {
            let aValue, bValue;
            
            if (sortBy === 'name') {
                // İsime göre sırala
                aValue = a.querySelector('td:nth-child(2)').textContent.trim();
                bValue = b.querySelector('td:nth-child(2)').textContent.trim();
                return aValue.localeCompare(bValue);
            } else {
                // Sayısal değerlere göre sırala
                const aIndex = sortBy === 'score' ? 3 : (sortBy === 'kills' ? 4 : (sortBy === 'deaths' ? 5 : 3));
                const bIndex = aIndex;
                
                aValue = parseInt(a.querySelector(`td:nth-child(${aIndex})`).textContent.trim());
                bValue = parseInt(b.querySelector(`td:nth-child(${bIndex})`).textContent.trim());
                
                return bValue - aValue; // Büyükten küçüğe sırala
            }
        });
        
        // Sıralanmış satırları tabloya ekle
        const tableBody = tableElement.querySelector('tbody');
        tableRows.forEach((row, index) => {
            // Sıra numarasını güncelle
            row.querySelector('td:first-child').textContent = index + 1;
            tableBody.appendChild(row);
        });
    });
    
    // Sıralama mesajı göster
    const sortMsg = document.createElement('div');
    sortMsg.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
    sortMsg.innerHTML = `<i class="fas fa-sort-amount-down mr-2"></i> ${getSortLabel(sortBy)} göre sıralandı`;
    document.body.appendChild(sortMsg);
    
    // Mesajı 2 saniye sonra kaldır
    setTimeout(() => {
        sortMsg.remove();
    }, 2000);
}

// Sıralama etiketi al
function getSortLabel(sortBy) {
    switch(sortBy) {
        case 'name': return 'İsme';
        case 'score': return 'Skora';
        case 'kills': return 'Kill sayısına';
        case 'deaths': return 'Ölüm sayısına';
        default: return 'Skora';
    }
}

// İstatistik panellerini güncelle
function updateStatPanels(ctPlayers, tPlayers) {
    // Tüm oyuncuları birleştir
    const allPlayers = [...ctPlayers, ...tPlayers];
    
    // En iyi oyuncular (skor)
    updateTopPlayersList(allPlayers, 'top-players-list', 'score');
    
    // En çok kill
    updateTopPlayersList(allPlayers, 'top-killers-list', 'kills');
    
    // En iyi K/D oranı
    updateKDRatioList(allPlayers, 'top-kd-list');
}

// En iyi oyuncular listesini güncelle
function updateTopPlayersList(players, listId, sortKey) {
    const listElement = document.getElementById(listId);
    if (!listElement) return;
    
    // Oyuncuları sırala ve ilk 5'i al
    const topPlayers = [...players].sort((a, b) => b[sortKey] - a[sortKey]).slice(0, 5);
    
    // Liste içeriğini temizle
    listElement.innerHTML = '';
    
    // Liste boşsa, veri yok mesajı göster
    if (topPlayers.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'text-center p-3 text-gray-400';
        emptyItem.textContent = 'Veri yok';
        listElement.appendChild(emptyItem);
        return;
    }
    
    // Madalyalar
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    
    // Oyuncuları listeye ekle
    topPlayers.forEach((player, index) => {
        const item = document.createElement('li');
        item.className = 'flex items-center justify-between p-2 bg-gray-600 rounded-md';
        
        // Değer ve renk
        let valueText = '';
        let valueColor = '';
        
        if (sortKey === 'score') {
            valueText = `${player.score} puan`;
            valueColor = 'text-yellow-400';
        } else if (sortKey === 'kills') {
            valueText = `${player.kills} kill`;
            valueColor = 'text-green-400';
        }
        
        item.innerHTML = `
            <div class="flex items-center">
                <span class="text-xl mr-2">${medals[index]}</span>
                <span>${player.name}</span>
            </div>
            <div class="${valueColor} font-bold">${valueText}</div>
        `;
        
        listElement.appendChild(item);
    });
}

// En iyi K/D oranı listesini güncelle
function updateKDRatioList(players, listId) {
    const listElement = document.getElementById(listId);
    if (!listElement) return;
    
    // Ölüm sayısı 0'dan büyük oyuncuları filtrele
    const playersWithDeaths = players.filter(p => p.deaths > 0);
    
    // K/D oranını hesapla, sırala ve ilk 5'i al
    const topKD = playersWithDeaths
        .map(p => ({...p, kd: p.kills / p.deaths}))
        .sort((a, b) => b.kd - a.kd)
        .slice(0, 5);
    
    // Liste içeriğini temizle
    listElement.innerHTML = '';
    
    // Liste boşsa, veri yok mesajı göster
    if (topKD.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'text-center p-3 text-gray-400';
        emptyItem.textContent = 'Veri yok';
        listElement.appendChild(emptyItem);
        return;
    }
    
    // Madalyalar
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    
    // Oyuncuları listeye ekle
    topKD.forEach((player, index) => {
        const item = document.createElement('li');
        item.className = 'flex items-center justify-between p-2 bg-gray-600 rounded-md';
        
        item.innerHTML = `
            <div class="flex items-center">
                <span class="text-xl mr-2">${medals[index]}</span>
                <span>${player.name}</span>
            </div>
            <div class="text-blue-400 font-bold">${player.kd.toFixed(2)}</div>
        `;
        
        listElement.appendChild(item);
    });
} 