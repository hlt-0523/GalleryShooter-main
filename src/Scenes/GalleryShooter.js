class GalleryShooter extends Phaser.Scene {
    constructor() {
        super("movementScene"); // Initialize this scene with a name for reference in Phaser.
        this.my = { sprite: {} }; // Custom object to store references to sprite groups.

        // Player coordinates and bullet cooldown settings.
        this.playerX = 400;
        this.playerY = 575;
        this.bulletCD = 5; // Cooldown period for shooting bullets.
        this.bulletCDTimer = 0; // Timer to manage bullet shooting cooldown.

        // Keyboard input initialization.
        this.keyA = null; // Key for moving left.
        this.keyD = null; // Key for moving right.
        this.spaceKey = null; // Key for shooting.
        this.keyR = null; // Key for restarting the game.

        // Game state variables.
        this.health = 3; // Player's health.
        this.highscore = 0; // Highest score achieved.
        this.score = 0; // Current score.
        this.wave = 1; // Current enemy wave.
        this.waveTimer = 0; // Timer to track progression within a wave.
        this.gameOver = false; // Flag to check if the game is over.

        // Enemy formations and settings.
        this.my.sprite.enemyFormation1 = []; // Array to hold the first enemy formation.
        this.enemyFormation1Size = 20; // Number of enemies in the first formation.
        this.my.sprite.enemyFormation2_Left = []; // Array for enemies that will move from the left.
        this.enemyFormation2_LeftSize = 20; // Size of the left-moving enemy formation.
        this.my.sprite.enemyFormation2_Right = []; // Array for enemies that will move from the right.
        this.enemyFormation2_RightSize = 20; // Size of the right-moving enemy formation.
        this.my.sprite.enemyFormation3 = []; // Array for shooting enemies.
        this.enemyFormation3Size = 10; // Number of shooting enemies.
        this.enemyShotCD = 50; // Cooldown period for enemies to shoot.
        this.enemyShotCDTimer = 0; // Timer to manage enemy shooting cooldown.
    }

    preload() {
        // Load assets like images and sounds.
        this.load.setPath("./assets/");
        this.load.image("player", "tile_ramp_right.png");
        this.load.image("bullet", "red_hand_peace.png");
        this.load.image("basicEnemy_blue", "blue_body_circle.png");
        this.load.image("movingEnemy_green", "green_body_circle.png");
        this.load.image("shootingEnemy_red", "red_body_circle.png");
        this.load.image("enemyShot", "tile_cloud.png");
        this.load.audio("shoot", "shoot.ogg");
        this.load.audio("hitPlayer", "pepSound1.ogg");
        this.load.audio("hitEnemy", "phaserUp5.ogg");
        this.load.audio("enemyShoot", "laser6.ogg");
        this.load.audio("nextWave", "threeTone2.ogg");
        this.load.audio("winGame", "end.wav");
        document.getElementById('description').innerHTML = '<h2>A - move left // D - move right<bra>Space - shoot</h2>'; // Display controls on the web page.
    }

    create() {
        // Create game objects and set initial game state.
        let my = this.my;

        // Setup player sprite.
        my.sprite.player = this.add.sprite(this.playerX, this.playerY, "player");
        my.sprite.player.scale = 0.5; // Set the scale for player sprite.

        // Create bullet group for managing multiple bullets.
        my.sprite.bulletGroup = this.add.group({
            defaultKey: "bullet",
            maxSize: 3 // Maximum number of bullets that can be active at once.
        });
        my.sprite.bulletGroup.createMultiple({
            active: false,
            visible: false,
            key: my.sprite.bulletGroup.defaultKey,
            repeat: my.sprite.bulletGroup.maxSize - 1 // Create the bullets beforehand.
        });

        // Initialize enemy formations.
        this.createFormation(my.sprite.enemyFormation1, this.enemyFormation1Size, "basicEnemy_blue");
        this.createFormation(my.sprite.enemyFormation2_Left, this.enemyFormation2_LeftSize, "movingEnemy_green"); // Enemies moving from the left.
        this.createFormation(my.sprite.enemyFormation2_Right, this.enemyFormation2_RightSize, "movingEnemy_green"); // Enemies moving from the right.
        this.createFormation(my.sprite.enemyFormation3, this.enemyFormation3Size, "shootingEnemy_red"); // Shooting enemies.

        // Create a group for enemy shots.
        my.sprite.enemyShotGroup = this.add.group({
            defaultKey: "enemyShot",
            maxSize: 10 // Maximum number of enemy shots that can be active at once.
        });
        my.sprite.enemyShotGroup.createMultiple({
            active: false,
            visible: false,
            key: my.sprite.enemyShotGroup.defaultKey,
            repeat: my.sprite.enemyShotGroup.maxSize - 1 // Pre-create enemy shots for reuse.
        });

        // Assign keys for player input.
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // Setup text displays for game information.
        this.highscoreText = this.add.text(16, 560, "High Score:0", { fontSize: '32px', fill: '#FFF', fontStyle: 'bold' });
        this.scoreText = this.add.text(16, 530, "Score:0", { fontSize: '32px', fill: '#FFF', fontStyle: 'bold' });
        this.wavesText = this.add.text(132, 40, "Wave 1", { fontSize: '32px', fill: "#FFF" });
        this.wavesText.setOrigin(1);
        this.livesText = this.add.text(170, 70, "Lives: 3", { fontSize: '32px', fill: "#ff073a" });
        this.livesText.setOrigin(1);

        // Text displays for game state (Game Over, Win, Lose).
        this.gameOverText = this.add.text(400, 200, "GAME OVER", { fontSize: '64px', fill: "#FFF", fontStyle: 'bold', stroke: '#0f0', strokeThickness: 6 });
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.visible = false;
        this.winText = this.add.text(400, 250, "You won!", { fontSize: '48px', fill: "#ff073a", fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3 });
        this.winText.setOrigin(0.5);
        this.winText.visible = false;
        this.loseText = this.add.text(400, 250, "You are destroyed", { fontSize: '64px', fill: "#FFF", fontStyle: 'bold', stroke: '#0f0', strokeThickness: 6 });
        this.loseText.setOrigin(0.5);
        this.loseText.visible = false;
        this.highscoreDisplay = this.add.text(400, 325, "NEW HIGHSCORE ", { fontSize: "64px", fill: "#ff073a" });
        this.highscoreDisplay.setOrigin(0.5);
        this.highscoreDisplay.visible = false;
        this.restartText = this.add.text(400, 400, "press \"R\" to restart the game", { fontSize: '40px', fill: "#FFF", fontStyle: 'bold', stroke: '#0f0', strokeThickness: 6 });
        this.restartText.setOrigin(0.5);
        this.restartText.visible = false;
    }

    update() {
        let my = this.my;

        // Game loop to handle game updates.
        if (!this.gameOver) {
            // Decrease timers for bullet and enemy shooting cooldown.
            this.bulletCDTimer--;
            this.enemyShotCDTimer--;
            this.waveTimer++; // Increment wave timer.

            // Handle shooting with space key.
            if (this.spaceKey.isDown) {
                if (this.bulletCDTimer < 0) {
                    let bullet = my.sprite.bulletGroup.getFirstDead(); // Get an inactive bullet from the pool.
                    if (bullet != null) {
                        this.sound.play("shoot"); // Play shooting sound.
                        bullet.active = true;
                        bullet.visible = true;
                        bullet.x = my.sprite.player.x; // Set bullet starting position.
                        bullet.y = my.sprite.player.y - 25;
                        bullet.scale = 0.5; // Set bullet scale.
                        this.bulletCDTimer = this.bulletCD; // Reset bullet cooldown timer.
                    }
                }
            }

            // Update bullet positions and check for collisions with enemies.
            for (let bullet of my.sprite.bulletGroup.getChildren()) {
                if (bullet.y < -30) {
                    bullet.active = false;
                    bullet.visible = false; // Deactivate and hide the bullet if it moves off screen.
                }
                this.checkBulletCollision(my.sprite.enemyFormation1, bullet); // Check for collisions with enemies in formation 1.
                this.checkBulletCollision(my.sprite.enemyFormation2_Left, bullet); // Check for collisions with enemies moving from the left.
                this.checkBulletCollision(my.sprite.enemyFormation2_Right, bullet); // Check for collisions with enemies moving from the right.
                this.checkBulletCollision(my.sprite.enemyFormation3, bullet); // Check for collisions with shooting enemies.
            }
            my.sprite.bulletGroup.incY(-20); // Move all bullets up the screen.

            // Wave handling logic.
            if (this.wave == 1) {
                if (this.waveTimer == 25) {
                    this.spawnStaticWave(0, 5); // Spawn first segment of the wave.
                } else if (this.waveTimer == 75) {
                    this.spawnStaticWave(5, 10); // Spawn second segment of the wave.
                } else if (this.waveTimer == 150) {
                    this.spawnStaticWave(10, 15); // Spawn third segment of the wave.
                } else if (this.waveTimer == 275) {
                    this.spawnStaticWave(15, 20); // Spawn fourth segment of the wave.
                } else if (this.waveTimer == 400) {
                    this.spawnStaticWave(0, 5); // Repeat spawning the first segment.
                } else if (this.waveTimer == 600) {
                    this.NextWave(); // Progress to the next wave.
                }
            } else if (this.wave == 2) {
                if (this.waveTimer == 25) {
                    this.spawnMovingWave(my.sprite.enemyFormation2_Left, "Left", 0, 4); // Spawn enemies moving from the left.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Right, "Right", 0, 4); // Spawn enemies moving from the right.
                } else if (this.waveTimer == 75) {
                    this.spawnStaticWave(5, 10); // Spawn static enemies.
                } else if (this.waveTimer == 100) {
                    this.spawnStaticWave(10, 15); // Continue spawning static enemies.
                } else if (this.waveTimer == 125) {
                    this.spawnStaticWave(15, 20); // Continue spawning static enemies.
                } else if (this.waveTimer == 225) {
                    this.spawnMovingWave(my.sprite.enemyFormation2_Left, "Left", 8, 12); // Spawn more enemies moving from the left.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Right, "Right", 4, 8); // Spawn more enemies moving from the right.
                } else if (this.waveTimer == 425) {
                    this.NextWave(); // Progress to the next wave.
                }
            } else if (this.wave == 3) {
                if (this.waveTimer == 25) {
                    this.spawnShootingWave(0, 5); // Spawn enemies that can shoot.
                } if (this.waveTimer == 325) {
                    this.NextWave(); // Progress to the next wave.
                }
            } else if (this.wave == 4) {
                if (this.waveTimer == 25) {
                    this.spawnShootingWave(5, 10); // Spawn more shooting enemies.
                    this.spawnStaticWave(0, 5); // Spawn static enemies.
                } else if (this.waveTimer == 125) {
                    this.spawnMovingWave(my.sprite.enemyFormation2_Left, "Left", 0, 4); // Continue spawning enemies moving from the left.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Right, "Right", 0, 4); // Continue spawning enemies moving from the right.
                } else if (this.waveTimer == 200) {
                    this.spawnMovingWave(my.sprite.enemyFormation2_Left, "Left", 4, 8); // Spawn additional enemies moving from the left.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Right, "Right", 4, 8); // Spawn additional enemies moving from the right.
                } else if (this.waveTimer == 300) {
                    this.spawnStaticWave(5, 10); // Spawn static enemies.
                    this.spawnStaticWave(10, 15); // Continue spawning static enemies.
                } else if (this.waveTimer == 500) {
                    this.NextWave(); // Progress to the next wave.
                }
            } else if (this.wave == 5) {
                if (this.waveTimer == 25) {
                    this.spawnShootingWave(0, 5); // Spawn shooting enemies.
                    this.spawnStaticWave(15, 20); // Spawn static enemies.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Left, "Left", 0, 4); // Spawn enemies moving from the left.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Right, "Right", 0, 4); // Spawn enemies moving from the right.
                } else if (this.waveTimer == 225) {
                    this.spawnShootingWave(5, 10); // Spawn more shooting enemies.
                    this.spawnStaticWave(0, 5); // Spawn static enemies.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Left, "Left", 4, 8); // Spawn additional enemies moving from the left.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Right, "Right", 4, 8); // Spawn additional enemies moving from the right.
                } else if (this.waveTimer == 425) {
                    this.spawnStaticWave(5, 10); // Spawn static enemies.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Left, "Left", 8, 12); // Spawn more enemies moving from the left.
                    this.spawnMovingWave(my.sprite.enemyFormation2_Right, "Right", 8, 12); // Spawn more enemies moving from the right.
                } else if (this.waveTimer > 800) {
                    this.sound.play("winGame"); // Play winning sound effect.
                    this.score += 1000; // Award bonus score for winning.
                    this.gameOver = true; // Set game over flag to true.
                }
            }

            // Update enemy positions and check for collisions.
            for (let enemy of my.sprite.enemyFormation1) {
                if (enemy.visible) {
                    enemy.y += 2; // Move enemy down the screen.
                }
                if (enemy.y > 650) {
                    enemy.visible = false; // Hide enemy if it moves off screen.
                }
                this.checkEnemyCollision(enemy); // Check for collisions between the player and this enemy.
            }
            for (let enemy of my.sprite.enemyFormation2_Left) {
                if (enemy.visible) {
                    enemy.y += 3; // Move enemy down the screen faster.
                    if (enemy.y < 250) {
                        enemy.x += 3; // Move enemy to the right when above y=250.
                    } else if (enemy.y < 400) {
                        enemy.x -= 3; // Move enemy to the left when between y=250 and y=400.
                    } else if (enemy.y > 650) {
                        enemy.visible = false; // Hide enemy if it moves off screen.
                    } else {
                        enemy.x += 3; // Continue moving enemy to the right below y=400.
                    }
                }
                this.checkEnemyCollision(enemy); // Check for collisions between the player and this enemy.
            }
            for (let enemy of my.sprite.enemyFormation2_Right) {
                if (enemy.visible) {
                    enemy.y += 3; // Move enemy down the screen faster.
                    if (enemy.y < 250) {
                        enemy.x -= 3; // Move enemy to the left when above y=250.
                    } else if (enemy.y < 400) {
                        enemy.x += 3; // Move enemy to the right when between y=250 and y=400.
                    } else if (enemy.y > 650) {
                        enemy.visible = false; // Hide enemy if it moves off screen.
                    } else {
                        enemy.x -= 3; // Continue moving enemy to the left below y=400.
                    }
                }
                this.checkEnemyCollision(enemy); // Check for collisions between the player and this enemy.
            }
            for (let enemy of my.sprite.enemyFormation3) {
                if (enemy.visible) {
                    var randomMovement = Math.floor(Math.random() * 2); // Randomize enemy horizontal movement.
                    enemy.y += 1.75; // Move enemy down the screen at a slower rate.
                    if (randomMovement == 0) {
                        enemy.x += 6; // Move enemy to the right randomly.
                    } else if (randomMovement == 1) {
                        enemy.x -= 6; // Move enemy to the left randomly.
                    }

                    var willShoot = Math.floor(Math.random() * 5); // Randomize shooting chances.
                    if (willShoot == 1) {
                        if (this.enemyShotCDTimer < 0) {
                            this.sound.play("enemyShoot"); // Play shooting sound effect.
                            let enemyShot = my.sprite.enemyShotGroup.getFirstDead(); // Get an inactive enemy shot from the pool.
                            if (enemyShot != null) {
                                enemyShot.active = true;
                                enemyShot.visible = true;
                                enemyShot.x = enemy.x; // Set shooting position based on enemy's position.
                                enemyShot.y = enemy.y + 20;
                                enemyShot.scale = 0.3; // Set the scale for enemy shots.
                                this.enemyShotCDTimer = 10 + Math.floor(Math.random() * this.enemyShotCD); // Reset the enemy shooting cooldown timer with randomness.
                            }
                        }
                    }
                    if (enemy.y > 650) {
                        enemy.visible = false; // Hide enemy if it moves off screen.
                    }
                }
                this.checkEnemyCollision(enemy); // Check for collisions between the player and this enemy.
            }
            for (let enemyShot of my.sprite.enemyShotGroup.getChildren()) {
                if (enemyShot.y > 630) {
                    enemyShot.active = false;
                    enemyShot.visible = false; // Deactivate and hide the enemy shot if it moves off screen.
                }
                if (this.collides(my.sprite.player, enemyShot)) {
                    this.sound.play("hitPlayer"); // Play sound effect when the player is hit.
                    enemyShot.x = -100;
                    enemyShot.y = 700;
                    this.health--; // Decrease player's health.
                    this.livesText.setText("Lives: " + this.health); // Update the display of lives.
                    this.checkGameOver(); // Check if the game should be over based on health.
                }
                
            }
            my.sprite.enemyShotGroup.incY(10); // Move all enemy shots down the screen.

            // Player movement handling.
            if (this.keyA.isDown) {
                if (my.sprite.player.x > 35) {
                    my.sprite.player.x -= 12; // Move player left.
                }
            }
            if (this.keyD.isDown) {
                if (my.sprite.player.x < 765) {
                    my.sprite.player.x += 12; // Move player right.
                }
            }
        } else {
            // Handle game over state.
            this.gameOverText.visible = true; // Show game over text.
            this.restartText.visible = true; // Show restart text.
            if (this.health <= 0) {
                this.loseText.visible = true; // Show lose text if health is zero.
            } else {
                this.scoreText.setText("Score: " + this.score); // Update score display.
                this.winText.visible = true; // Show win text if the game was won without losing all health.
            }

            // High score handling.
            if (this.score > this.highscore) {
                this.highscore = this.score; // Update high score if current score is higher.
                this.highscoreDisplay.visible = true; // Show new high score text.
            }

            // Restart game handling.
            if (this.keyR.isDown) {
                this.restartGame(); // Call function to restart the game.
            }
        }
    }

    collides(a, b) {
        // Collision detection function for sprites.
        if (Math.abs(a.x - b.x) > (a.displayWidth / 2 + b.displayWidth / 2)) return false; // Check horizontal distance.
        if (Math.abs(a.y - b.y) > (a.displayHeight / 2 + b.displayHeight / 2)) return false; // Check vertical distance.
        return true; // Return true if no conditions for 'no collision' are met.
    }

    createFormation(group, groupSize, sprite) {
        // Function to create an enemy formation.
        for (let i = 0; i < groupSize; i++) {
            group.push(this.add.sprite(-100, -100, sprite)); // Add a new sprite to the group.
            group[i].visible = false; // Initially make the sprite invisible.
            group[i].scale = 0.4; // Set scale for the sprite.
        }
    }

    checkEnemyCollision(enemy) {
        // Function to check collision between the player and an enemy.
        if (this.collides(enemy, this.my.sprite.player)) {
            this.sound.play("hitPlayer"); // Play sound effect when the player is hit.
            enemy.y = -100; // Move the enemy off screen.
            enemy.visible = false; // Make the enemy invisible.
            this.health--; // Decrease player's health.
            this.livesText.setText("Lives: " + this.health); // Update the display of lives.
            this.checkGameOver(); // Check if the game should be over based on health.
        }
    }
    checkBulletCollision(object, bullet) {
        // Function to check collision between a bullet and enemies.
        for (let enemy of object) {
            if (this.collides(enemy, bullet)) {
                this.sound.play("hitEnemy"); // Play sound effect when an enemy is hit.
                enemy.y = 700; // Move the enemy off screen.
                enemy.visible = false; // Make the enemy invisible.
                bullet.x = -300;
                bullet.y = -100; // Move the bullet off screen.
                if (object == this.my.sprite.enemyFormation1) {
                    this.updateScore(10); // Update score for hitting an enemy in formation 1.
                } else if (object == this.my.sprite.enemyFormation2_Left || object == this.my.sprite.enemyFormation2_Right) {
                    this.updateScore(20); // Update score for hitting an enemy in formations moving from the left or right.
                } else {
                    this.updateScore(30); // Update score for hitting a shooting enemy.
                }
            }
        }
    }
    checkGameOver() {
        // Function to check if the game is over based on player health.
        if (this.health <= 0) {
            this.gameOver = true; // Set game over flag to true.
        }
    }

    spawnStaticWave(begin, end) {
        // Function to spawn a static wave of enemies.
        let xValue = Math.floor(Math.random() * 400); // Randomize the starting x position for the wave.
        for (let i = begin; i < end; i++) {
            this.my.sprite.enemyFormation1[i].x = i % 5 * 100 + xValue; // Set x position for each enemy based on a pattern.
            this.my.sprite.enemyFormation1[i].y = -100; // Start enemies off screen above the view.
            this.my.sprite.enemyFormation1[i].visible = true; // Make enemies visible.
        }
    }
    updateScore(points) {
        // Function to update the game score.
        this.score += points; // Add points to the current score.
        this.scoreText.setText("Score: " + this.score); // Update the score display.
    }
    spawnMovingWave(enemies, path, begin, end) {
        // Function to spawn a wave of moving enemies.
        for (let i = begin; i < end; i++) {
            if (path == "Left") {
                enemies[i].x = -(i % 4 * 60) + 60; // Set x position for enemies moving from the left.
                enemies[i].y = -(i % 4 * 60) - 60; // Set y position for these enemies.
            } else {
                enemies[i].x = (i % 4 * 60) + 700; // Set x position for enemies moving from the right.
                enemies[i].y = -(i % 4 * 60) - 50; // Set y position for these enemies.
            }
            enemies[i].visible = true; // Make these enemies visible.
        }
    }

    spawnShootingWave(begin, end) {
        // Function to spawn a wave of shooting enemies.
        for (let i = begin; i < end; i++) {
            this.my.sprite.enemyFormation3[i].x = Math.floor(Math.random() * 500) + 50; // Randomize the x position for shooting enemies.
            this.my.sprite.enemyFormation3[i].y = -(i % 5 * 120) - 50; // Set y position for these enemies.
            this.my.sprite.enemyFormation3[i].visible = true; // Make these enemies visible.
        }
    }

    NextWave() {
        // Function to transition to the next wave.
        this.sound.play("nextWave"); // Play sound effect for starting the next wave.
        this.wave++; // Increment the wave number.
        this.waveTimer = 0; // Reset the wave timer.
        this.wavesText.setText("Wave " + this.wave); // Update the display for the current wave.
    }

    restartGame() {
        // Function to restart the game.
        this.playerX = 400; // Reset player's x position.
        this.playerY = 400; // Reset player's y position.

        this.bulletCDTimer = 0; // Reset the bullet cooldown timer.

        this.health = 3; // Reset player's health.
        this.score = 0; // Reset the score.
        this.wave = 1; // Reset the wave number.
        this.waveTimer = 0; // Reset the wave timer.
        this.enemyShotCDTimer = 0; // Reset the enemy shooting cooldown timer.
        this.highscoreText.setText("High Score: " + this.highscore); // Update the high score display.
        this.scoreText.setText("Score: 0"); // Reset the score display.
        this.wavesText.setText("Wave 1"); // Reset the wave display.
        this.livesText.setText("Lives: 3"); // Reset the lives display.

        this.gameOverText.visible = false; // Hide the game over text.
        this.winText.visible = false; // Hide the win text.
        this.loseText.visible = false; // Hide the lose text.
        this.highscoreDisplay.visible = false; // Hide the high score display.
        this.restartText.visible = false; // Hide the restart text.

        for (let bullet of this.my.sprite.bulletGroup.getChildren()) {
            bullet.active = false;
            bullet.visible = false; // Deactivate and hide all bullets.
        }
        this.resetEnemyPosition(this.my.sprite.enemyFormation1); // Reset positions for the first formation of enemies.
        this.resetEnemyPosition(this.my.sprite.enemyFormation2_Left); // Reset positions for the left-moving enemies.
        this.resetEnemyPosition(this.my.sprite.enemyFormation2_Right); // Reset positions for the right-moving enemies.
        this.resetEnemyPosition(this.my.sprite.enemyFormation3); // Reset positions for the shooting enemies.

        for (let enemyShot of this.my.sprite.enemyShotGroup.getChildren()) {
            enemyShot.active = false;
            enemyShot.visible = false; // Deactivate and hide all enemy shots.
        }

        this.gameOver = false; // Reset the game over flag.
    }

    resetEnemyPosition(enemies) {
        // Function to reset positions of enemies.
        for (let enemy of enemies) {
            enemy.x = -120; // Set x position off screen.
            enemy.y = -120; // Set y position off screen.
            enemy.visible = false; // Make the enemy invisible.
        }
    }
}
