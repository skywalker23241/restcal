/* RestCal 界面点击引导：负责聚光灯、说明卡片定位和步骤推进。 */
(function () {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function visibleElement(selectorOrResolver) {
        const result = typeof selectorOrResolver === "function"
            ? selectorOrResolver()
            : document.querySelector(selectorOrResolver);
        if (!(result instanceof HTMLElement)) return null;
        const rect = result.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 ? result : null;
    }

    function wait(ms) {
        return new Promise(resolve => window.setTimeout(resolve, ms));
    }

    class ProductTour {
        constructor({steps, onFinish, onSkip} = {}) {
            this.steps = Array.isArray(steps) ? steps : [];
            this.onFinish = onFinish;
            this.onSkip = onSkip;
            this.index = -1;
            this.target = null;
            this.active = false;
            this.runToken = 0;
            this.targetClickHandler = null;
            this.returnFocus = null;
            this.positionTimer = 0;
            this.handleViewportChange = () => this.position();
            this.build();
        }

        build() {
            const root = document.createElement("div");
            root.className = "product-tour";
            root.hidden = true;
            root.innerHTML = `
                <div class="product-tour-shade" data-tour-shade="top"></div>
                <div class="product-tour-shade" data-tour-shade="right"></div>
                <div class="product-tour-shade" data-tour-shade="bottom"></div>
                <div class="product-tour-shade" data-tour-shade="left"></div>
                <section class="product-tour-card" role="dialog" aria-modal="false" aria-labelledby="productTourTitle" aria-describedby="productTourText">
                    <div class="product-tour-meta"><span id="productTourStep"></span><button class="product-tour-close" type="button" aria-label="退出界面引导">×</button></div>
                    <h2 id="productTourTitle"></h2>
                    <p id="productTourText"></p>
                    <div class="product-tour-click-hint" hidden><span aria-hidden="true">↖</span> 点击高亮区域继续</div>
                    <div class="product-tour-actions">
                        <button class="btn ghost product-tour-back" type="button">上一步</button>
                        <button class="btn primary product-tour-next" type="button">下一步</button>
                    </div>
                </section>
            `;
            document.body.appendChild(root);
            this.root = root;
            this.card = root.querySelector(".product-tour-card");
            this.title = root.querySelector("#productTourTitle");
            this.text = root.querySelector("#productTourText");
            this.stepLabel = root.querySelector("#productTourStep");
            this.hint = root.querySelector(".product-tour-click-hint");
            this.backButton = root.querySelector(".product-tour-back");
            this.nextButton = root.querySelector(".product-tour-next");
            this.shades = Object.fromEntries(
                [...root.querySelectorAll("[data-tour-shade]")].map(node => [node.dataset.tourShade, node])
            );
            root.querySelector(".product-tour-close").addEventListener("click", () => this.skip());
            this.backButton.addEventListener("click", () => this.show(this.index - 1));
            this.nextButton.addEventListener("click", () => this.next());
        }

        async start(startIndex = 0) {
            if (!this.steps.length) return;
            this.returnFocus = document.activeElement;
            this.active = true;
            this.root.hidden = false;
            window.addEventListener("resize", this.handleViewportChange);
            window.addEventListener("scroll", this.handleViewportChange, true);
            await this.show(startIndex);
        }

        async show(index) {
            if (!this.active) return;
            if (index < 0) index = 0;
            if (index >= this.steps.length) return this.finish();
            const token = ++this.runToken;
            this.detachTarget();
            const step = this.steps[index];
            this.root.classList.add("is-preparing");
            if (typeof step.beforeEnter === "function") await step.beforeEnter();
            if (!this.active || token !== this.runToken) return;

            let target = null;
            for (let attempt = 0; attempt < 20 && !target; attempt += 1) {
                target = visibleElement(step.target);
                if (!target) await wait(40);
            }
            if (!target) {
                console.warn(`界面引导未找到第 ${index + 1} 步目标`, step.target);
                return this.show(index + 1);
            }

            const rect = target.getBoundingClientRect();
            if (rect.top < 12 || rect.bottom > window.innerHeight - 12) {
                target.scrollIntoView({block: "center", inline: "center", behavior: reduceMotion.matches ? "auto" : "smooth"});
                await wait(reduceMotion.matches ? 20 : 220);
            }
            if (!this.active || token !== this.runToken) return;

            this.index = index;
            this.target = target;
            this.title.textContent = step.title;
            this.text.textContent = step.text;
            this.stepLabel.textContent = `${index + 1} / ${this.steps.length}`;
            this.backButton.hidden = index === 0;
            const clickToAdvance = step.advanceOn === "target-click";
            this.hint.hidden = !clickToAdvance;
            this.nextButton.hidden = clickToAdvance;
            this.nextButton.textContent = index === this.steps.length - 1 ? "完成" : "下一步";
            target.classList.add("product-tour-target");
            target.setAttribute("data-product-tour-active", "true");
            if (clickToAdvance) {
                this.targetClickHandler = () => window.setTimeout(() => this.next(), 0);
                target.addEventListener("click", this.targetClickHandler, {once: true});
            }
            this.root.classList.remove("is-preparing");
            this.position();
            window.clearTimeout(this.positionTimer);
            this.positionTimer = window.setTimeout(() => this.position(), 320);
            if (clickToAdvance) target.focus({preventScroll: true});
            else this.nextButton.focus({preventScroll: true});
        }

        next() {
            const step = this.steps[this.index];
            if (typeof step?.afterLeave === "function") step.afterLeave();
            this.show(this.index + 1);
        }

        position() {
            if (!this.active || !this.target?.isConnected) return;
            const padding = 7;
            const margin = 12;
            const gap = 14;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const targetRect = this.target.getBoundingClientRect();
            const hole = {
                top: Math.max(0, targetRect.top - padding),
                right: Math.min(viewportWidth, targetRect.right + padding),
                bottom: Math.min(viewportHeight, targetRect.bottom + padding),
                left: Math.max(0, targetRect.left - padding)
            };
            const holeWidth = Math.max(0, hole.right - hole.left);
            const holeHeight = Math.max(0, hole.bottom - hole.top);

            Object.assign(this.shades.top.style, {left: "0px", top: "0px", width: "100vw", height: `${hole.top}px`});
            Object.assign(this.shades.bottom.style, {left: "0px", top: `${hole.bottom}px`, width: "100vw", height: `${Math.max(0, viewportHeight - hole.bottom)}px`});
            Object.assign(this.shades.left.style, {left: "0px", top: `${hole.top}px`, width: `${hole.left}px`, height: `${holeHeight}px`});
            Object.assign(this.shades.right.style, {left: `${hole.right}px`, top: `${hole.top}px`, width: `${Math.max(0, viewportWidth - hole.right)}px`, height: `${holeHeight}px`});

            this.card.style.maxWidth = `${Math.max(280, viewportWidth - margin * 2)}px`;
            const cardRect = this.card.getBoundingClientRect();
            const cardWidth = Math.min(cardRect.width, viewportWidth - margin * 2);
            const cardHeight = cardRect.height;
            const spaceBelow = viewportHeight - hole.bottom;
            const spaceAbove = hole.top;
            let top;
            let left = Math.min(
                Math.max(margin, hole.left + holeWidth / 2 - cardWidth / 2),
                viewportWidth - cardWidth - margin
            );

            if (spaceBelow >= cardHeight + gap + margin) top = hole.bottom + gap;
            else if (spaceAbove >= cardHeight + gap + margin) top = hole.top - cardHeight - gap;
            else {
                top = Math.min(Math.max(margin, hole.bottom + gap), viewportHeight - cardHeight - margin);
                if (top < margin) top = margin;
            }
            this.card.style.left = `${left}px`;
            this.card.style.top = `${top}px`;
        }

        detachTarget() {
            if (!this.target) return;
            if (this.targetClickHandler) this.target.removeEventListener("click", this.targetClickHandler);
            this.target.classList.remove("product-tour-target");
            this.target.removeAttribute("data-product-tour-active");
            this.target = null;
            this.targetClickHandler = null;
        }

        close() {
            if (!this.active) return;
            this.active = false;
            this.runToken += 1;
            this.detachTarget();
            this.root.hidden = true;
            window.clearTimeout(this.positionTimer);
            window.removeEventListener("resize", this.handleViewportChange);
            window.removeEventListener("scroll", this.handleViewportChange, true);
            if (this.returnFocus instanceof HTMLElement && this.returnFocus.isConnected) {
                this.returnFocus.focus({preventScroll: true});
            }
            this.returnFocus = null;
        }

        finish() {
            this.close();
            if (typeof this.onFinish === "function") this.onFinish();
        }

        skip() {
            this.close();
            if (typeof this.onSkip === "function") this.onSkip();
        }
    }

    window.RestCalProductTour = Object.freeze({ProductTour});
})();
