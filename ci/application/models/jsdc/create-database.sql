SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

CREATE SCHEMA IF NOT EXISTS `jsdc` DEFAULT CHARACTER SET utf8 ;
USE `jsdc` ;

-- -----------------------------------------------------
-- Table `jsdc`.`Colors`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`Colors` (
  `colorId` INT NOT NULL AUTO_INCREMENT ,
  `name` VARCHAR(45) NOT NULL ,
  PRIMARY KEY (`colorId`) )
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`Teams`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`Teams` (
  `teamId` INT NOT NULL AUTO_INCREMENT ,
  `name` VARCHAR(45) NULL ,
  `abbr` VARCHAR(5) NULL ,
  `bio` LONGTEXT NULL ,
  `imageName` VARCHAR(45) NULL ,
  `deposit` TINYINT(1) NOT NULL DEFAULT 0 ,
  `university` VARCHAR(64) NOT NULL ,
  `registrationDate` DATE NOT NULL ,
  PRIMARY KEY (`teamId`) ,
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) )
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`MatchTeams`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`MatchTeams` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `matchId` INT NOT NULL ,
  `teamId` INT NOT NULL ,
  `colorId` INT NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_Matches_Colors1` (`colorId` ASC) ,
  INDEX `fk_Matches_Teams1` (`teamId` ASC) ,
  CONSTRAINT `fk_Matches_Colors1`
    FOREIGN KEY (`colorId` )
    REFERENCES `jsdc`.`Colors` (`colorId` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Matches_Teams1`
    FOREIGN KEY (`teamId` )
    REFERENCES `jsdc`.`Teams` (`teamId` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`MatchResults`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`MatchResults` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `teamId` INT NOT NULL ,
  `matchId` INT NOT NULL ,
  `score` INT NOT NULL DEFAULT 0 ,
  `fouls` INT NOT NULL DEFAULT 0 ,
  `disabled` TINYINT(1)  NOT NULL DEFAULT 0 ,
  `disqualified` TINYINT(1)  NOT NULL DEFAULT 0 ,
  PRIMARY KEY (`id`) )
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`Actions`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`Actions` (
  `actionId` INT NOT NULL AUTO_INCREMENT ,
  `fromValue` INT NOT NULL DEFAULT 0 ,
  `onValue` INT NOT NULL DEFAULT 0 ,
  `name` VARCHAR(45) NOT NULL ,
  PRIMARY KEY (`actionId`) )
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`APIKeys`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`APIKeys` (
  `id` INT(11) NOT NULL AUTO_INCREMENT ,
  `key` VARCHAR(45) NOT NULL ,
  `level` INT(2) NOT NULL ,
  `ignore_limits` TINYINT(1) NOT NULL DEFAULT 0 ,
  `date_created` INT(11) NOT NULL ,
  PRIMARY KEY (`id`) )
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`Permissions`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`Permissions` (
  `pId` INT NOT NULL ,
  `name` VARCHAR(45) NULL ,
  PRIMARY KEY (`pId`) )
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`Users`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`Users` (
  `userId` INT NOT NULL AUTO_INCREMENT ,
  `username` VARCHAR(45) NOT NULL ,
  `password` VARCHAR(45) NOT NULL ,
  `email` VARCHAR(45) NOT NULL ,
  `fullname` VARCHAR(45) NULL ,
  `ip` VARCHAR(37) NULL ,
  `pId` INT NOT NULL ,
  PRIMARY KEY (`userId`) ,
  UNIQUE INDEX `name_UNIQUE` (`username` ASC) ,
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) ,
  INDEX `fk_Users_Permissions1` (`pId` ASC) ,
  CONSTRAINT `fk_Users_Permissions1`
    FOREIGN KEY (`pId` )
    REFERENCES `jsdc`.`Permissions` (`pId` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`UsersAPI`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`UsersAPI` (
  `apiId` INT NOT NULL ,
  `userId` INT NOT NULL ,
  PRIMARY KEY (`userId`) ,
  INDEX `fk_UsersAPI_APIKeys1` (`apiId` ASC) ,
  CONSTRAINT `fk_UsersAPI_APIKeys1`
    FOREIGN KEY (`apiId` )
    REFERENCES `jsdc`.`APIKeys` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_UsersAPI_Users1`
    FOREIGN KEY (`userId` )
    REFERENCES `jsdc`.`Users` (`userId` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`MatchScoreHistory`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`MatchScoreHistory` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `matchId` INT NOT NULL ,
  `fromTeamId` INT NOT NULL ,
  `onTeamId` INT NOT NULL ,
  `actionId` INT NOT NULL DEFAULT 0 ,
  `foulId` INT NOT NULL DEFAULT 0 ,
  `apiId` INT NOT NULL ,
  `dateTime` DATETIME NOT NULL ,
  `disabled` TINYINT(1)  NOT NULL DEFAULT 0 ,
  `disqualified` TINYINT(1)  NOT NULL DEFAULT 0 ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_ScoreHistory_Actions` (`actionId` ASC) ,
  INDEX `fk_ScoreHistory_Matches1` (`matchId` ASC) ,
  INDEX `fk_ScoreHistory_UsersAPI1` (`apiId` ASC) ,
  CONSTRAINT `fk_ScoreHistory_Actions`
    FOREIGN KEY (`actionId` )
    REFERENCES `jsdc`.`Actions` (`actionId` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_ScoreHistory_Matches1`
    FOREIGN KEY (`matchId` )
    REFERENCES `jsdc`.`MatchTeams` (`matchId` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_ScoreHistory_UsersAPI1`
    FOREIGN KEY (`apiId` )
    REFERENCES `jsdc`.`UsersAPI` (`apiId` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`UsersTeams`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`UsersTeams` (
  `id` INT NOT NULL ,
  `userId` INT NOT NULL ,
  `teamId` INT NOT NULL ,
  PRIMARY KEY (`id`) )
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`Fouls`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`Fouls` (
  `foulId` INT NOT NULL AUTO_INCREMENT ,
  `value` INT NOT NULL DEFAULT 0 ,
  `name` VARCHAR(45) NOT NULL COMMENT 'Foul is appended on website. Do not prefix description with \"Foul\".' ,
  PRIMARY KEY (`foulId`) )
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `jsdc`.`Matches`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `jsdc`.`Matches` (
  `matchId` INT NOT NULL AUTO_INCREMENT ,
  `open` TINYINT(1)  NOT NULL DEFAULT 0 COMMENT 'Match scores should not be changed if the match is not open.' ,
  `status` ENUM('none','ready','running','paused','finished') NOT NULL DEFAULT 'none' COMMENT 'none = match has not started\nready = match is current but not started\nrunning = match is in progress\npaused = match is temporarily paused\nfinished = match has already been run' ,
  `roundNum` INT NOT NULL DEFAULT 0 ,
  `matchNum` INT NOT NULL DEFAULT 0 ,
  PRIMARY KEY (`matchId`) )
ENGINE = MyISAM;



SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Data for table `jsdc`.`Colors`
-- -----------------------------------------------------
START TRANSACTION;
USE `jsdc`;
INSERT INTO `jsdc`.`Colors` (`colorId`, `name`) VALUES (1, 'red');
INSERT INTO `jsdc`.`Colors` (`colorId`, `name`) VALUES (2, 'green');
INSERT INTO `jsdc`.`Colors` (`colorId`, `name`) VALUES (3, 'yellow');
INSERT INTO `jsdc`.`Colors` (`colorId`, `name`) VALUES (4, 'blue');

COMMIT;

-- -----------------------------------------------------
-- Data for table `jsdc`.`APIKeys`
-- -----------------------------------------------------
START TRANSACTION;
USE `jsdc`;
INSERT INTO `jsdc`.`APIKeys` (`id`, `key`, `level`, `ignore_limits`, `date_created`) VALUES (1, 'JSDC4Life', 1, 1, 0);

COMMIT;

-- -----------------------------------------------------
-- Data for table `jsdc`.`Fouls`
-- -----------------------------------------------------
START TRANSACTION;
USE `jsdc`;
INSERT INTO `jsdc`.`Fouls` (`foulId`, `value`, `name`) VALUES (1, -10, 'Personal');
INSERT INTO `jsdc`.`Fouls` (`foulId`, `value`, `name`) VALUES (2, -50, 'Technical');
INSERT INTO `jsdc`.`Fouls` (`foulId`, `value`, `name`) VALUES (3, -10000, 'Flagrant');

COMMIT;
