<?php

require_once('resources/config.php');

requireLogin(true, true);

$dbh = PDOConnect();

require_once(TEMPLATES_PATH . '/header-legacy.php');

showNav();

?>

<link rel="stylesheet" href="<?php echo APP_URL; ?>/css/tech-support.css">


<section class="heading row d-none">
	<div class="container">
		<div class="row">
			<div class="col-sm-12">
				<h1>Tech Support | DMZ Portal</h1>
			</div>
		</div>
	</div>
</section>


<div class="container-x component-card-x bg-w-x main-container- container-xl p-0 special-container special-container-inner" id="scheduler">

	<section class="mt-5 mb-4">
		<div class="container-fluid d-flex flex-column flex-grow-1">
			<!-- Row 1: Title -->
			<div class="row">
				<div class="col-sm-12">
					<h2 class="font-heavy">DMZ Tech Support</h2>
				</div>
			</div>

			<hr>

			<!-- Grid layout starts -->
			<div class="row flex-grow-1 h-100">
				<!-- Left Column: Topic buttons (stacked vertically, each in their own row) -->
				<div class="col-md-2 topicColumn d-flex flex-column">
					<div id="topic-buttons" class="nav nav-pills flex-column flex-grow-1 mt-3 mb-3">
						<!-- Each button will appear in its own row -->
					</div>
				</div>

				<!-- Right Column: OS  on top, then carousel -->
				<div class="col-md-10 d-flex flex-column h-100">
					<!-- OS Buttons Row -->
					<div id="os-buttons" class="nav nav-tabs"></div>

					<!-- Carousel Layout -->
					<div class="row flex-grow-1 p-3 carouselRow">
						<!-- Carousel navigation buttons (headings) -->
						<div id="column-carousel"></div>
						<div id="column-carousel-nav" class="col-md-2 d-flex flex-column"></div>

						<!-- Carousel image, instructions, and arrows -->

						<div id="column-carousel-info" class="col-md-10 d-flex flex-column">
							<div id="dmzCarousel" class="carousel slide h-100" data-bs-wrap="false">
								<div class="carousel-inner flex-grow-1" id="carousel-inner">
									<!-- Slides will be injected here -->
								</div>
								<div class="carousel-indicators" id="carousel-indicators"></div>

								<button class="carousel-control-prev mb-5 align-self-end" type="button" data-bs-target="#dmzCarousel" data-bs-slide="prev">
									<span class="carousel-control-prev-icon"></span>
								</button>
								<button class="carousel-control-next mb-5 align-self-end" type="button" data-bs-target="#dmzCarousel" data-bs-slide="next">
									<span class="carousel-control-next-icon"></span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

	</section>


</div>


<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?php echo APP_URL . JS_URL . '/tech-support.js'; ?>"></script>

<?php require_once(TEMPLATES_PATH . '/footer-legacy.php'); ?>